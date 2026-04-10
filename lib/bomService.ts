import { BomStatus, Prisma, ProductType, UserRole } from '@prisma/client';
import type { BomMetadata, BomRow, HardwareRow, Operation, PackingInfo, PackingRow } from '@/types';
import db from '@/lib/db';
import { computeSummary, recomputeRow } from '@/lib/calculations';
import { normalizeBomRow } from '@/lib/normalizeBomRow';
import { computePricingFromMetadata } from '@/lib/pricing';
import type { RequestActor } from '@/lib/rbac';
import { getWorkOrderUsage } from '@/lib/integrations/workOrder';
import { getComponentStocks } from '@/lib/integrations/inventory';
import { getProcurementSnapshot } from '@/lib/integrations/procurement';
import { sendApprovalRequestEmail, sendWeeklyOwnerSummary } from '@/lib/notifications';

export type BomWorkflowStatus = 'draft' | 'submitted' | 'approved' | 'final' | 'archived';
export type ExpiryState = 'active' | 'expired' | 'expiringSoon';
export type BomExportFormat = 'pdf' | 'excel' | 'both';

export interface BomCostSummary {
  material: number;
  manufacture: number;
  hardware: number;
  packing: number;
  treatment: number;
  grandTotal: number;
}

export interface BomVersionDTO {
  id: string;
  versionId: string;
  version: string;
  status: BomWorkflowStatus;
  isImmutable: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  notes?: string | null;
  parentVersionId?: string | null;
  metadata: BomMetadata;
  bomRows: BomRow[];
  hardwareRows: HardwareRow[];
  operations: Operation[];
  packingRows: PackingRow[];
  packingInfo: PackingInfo;
  costSummary: BomCostSummary;
}

export interface BomListItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  currentVersionId: string | null;
  version: string;
  versionId: string;
  status: BomWorkflowStatus;
  productType: BomMetadata['productType'];
  leadTime: string;
  effectiveDate: string;
  expiryDate: string;
  expiryState: ExpiryState;
  needsReview: string[];
  customer: string;
  itemType: string;
  bomType: string;
  variant: string;
  qty: string;
  dimensions: string;
  volM3: string;
  modulCount: number;
  subModulCount: number;
  partCount: number;
  hardwareCount: number;
  costSummary: BomCostSummary;
  createdAt: string;
  updatedAt: string;
}

export interface BomDocumentDTO {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  currentVersionId: string | null;
  productType: BomMetadata['productType'];
  leadTime: string;
  effectiveDate: string;
  expiryDate: string;
  expiryState: ExpiryState;
  needsReview: string[];
  costSummary: BomCostSummary;
  versions: BomVersionDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface BomListFilters {
  q?: string;
  status?: BomWorkflowStatus;
  productType?: BomMetadata['productType'];
  expiryState?: ExpiryState;
  needsReview?: boolean;
}

export interface CreateBomInput {
  code: string;
  name: string;
  description?: string;
  metadata?: Partial<BomMetadata>;
  bomRows?: BomRow[];
  hardwareRows?: HardwareRow[];
  operations?: Operation[];
  packingRows?: PackingRow[];
  packingInfo?: Partial<PackingInfo>;
  createdBy?: string;
}

export interface UpdateBomInput {
  metadata?: Partial<BomMetadata>;
  bomRows?: BomRow[];
  hardwareRows?: HardwareRow[];
  operations?: Operation[];
  packingRows?: PackingRow[];
  packingInfo?: Partial<PackingInfo>;
  notes?: string;
}

export interface CreateVersionInput extends UpdateBomInput {
  version?: string;
  status?: BomWorkflowStatus;
  createdBy?: string;
}

export interface LegacyMigrationPayload {
  docs?: unknown[];
  legacyState?: unknown;
}

const DEFAULT_ACTOR: RequestActor = { id: 'system', role: 'engineering' };
const REVIEW_DRAFT_AGE_DAYS = 14;
const REVIEW_LAST_UPDATE_DAYS = 180;
const EXPIRY_SOON_DAYS = 30;
const PRODUCT_TYPES: Array<BomMetadata['productType']> = ['Standard', 'Custom', 'Export', 'OEM'];
const APPROVER_ROLES: UserRole[] = ['owner', 'supervisor'];

function toNum(value: unknown): number {
  return Number.parseFloat(String(value ?? 0)) || 0;
}

function toIso(value: Date | string | null | undefined): string {
  if (!value) return '';
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeStatus(status: unknown): BomWorkflowStatus {
  const raw = String(status ?? 'draft').toLowerCase();
  if (raw === 'review') return 'submitted';
  if (raw === 'draft' || raw === 'submitted' || raw === 'approved' || raw === 'final' || raw === 'archived') {
    return raw;
  }
  return 'draft';
}

function toPrismaStatus(status: BomWorkflowStatus): BomStatus {
  if (status === 'submitted') return BomStatus.submitted;
  if (status === 'approved') return BomStatus.approved;
  if (status === 'final') return BomStatus.final;
  if (status === 'archived') return BomStatus.archived;
  return BomStatus.draft;
}

function normalizeProductType(value: unknown): BomMetadata['productType'] {
  const raw = String(value ?? '').trim();
  if (PRODUCT_TYPES.includes(raw as BomMetadata['productType'])) return raw as BomMetadata['productType'];
  return 'Standard';
}

function toPrismaProductType(value: BomMetadata['productType'] | undefined): ProductType {
  if (value === 'Custom') return ProductType.Custom;
  if (value === 'Export') return ProductType.Export;
  if (value === 'OEM') return ProductType.OEM;
  return ProductType.Standard;
}

function normalizeMetadata(input: Partial<BomMetadata> | undefined, codeFallback = '', nameFallback = ''): BomMetadata {
  const productCode = String(input?.productCode ?? codeFallback ?? '').trim();
  const productName = String(input?.productName ?? nameFallback ?? '').trim();
  const productType = normalizeProductType(input?.productType);
  return {
    productCode,
    productName,
    productDisplay: input?.productDisplay ? String(input.productDisplay) : `[${productCode}] ${productName}`.trim(),
    reference: String(input?.reference ?? ''),
    productVariant: String(input?.productVariant ?? 'Standard'),
    bomType: String(input?.bomType ?? 'manufacture'),
    productType,
    bomInputMode: input?.bomInputMode === 'manual' ? 'manual' : 'auto',
    currency: input?.currency === 'USD' ? 'USD' : 'IDR',
    barangProduksi: String(input?.barangProduksi ?? ''),
    proses: String(input?.proses ?? ''),
    versiBom: String(input?.versiBom ?? '1'),
    defaultVersi: Boolean(input?.defaultVersi),
    bomQuantity: String(input?.bomQuantity ?? '1'),
    bomUnit: String(input?.bomUnit ?? 'EA'),
    markupPercent: String(input?.markupPercent ?? '16.67'),
    usdRate: String(input?.usdRate ?? '16000'),
    leadTime: String(input?.leadTime ?? ''),
    effectiveDate: String(input?.effectiveDate ?? ''),
    expiryDate: String(input?.expiryDate ?? ''),
    customer: String(input?.customer ?? ''),
    buyerCode: String(input?.buyerCode ?? ''),
    company: String(input?.company ?? ''),
    itemType: String(input?.itemType ?? ''),
    wood: String(input?.wood ?? ''),
    coatingColor: String(input?.coatingColor ?? ''),
    itemDim: String(input?.itemDim ?? ''),
    itemWidth: String(input?.itemWidth ?? ''),
    itemDepth: String(input?.itemDepth ?? ''),
    itemHeight: String(input?.itemHeight ?? ''),
    volM3: String(input?.volM3 ?? ''),
  };
}

function normalizePackingInfo(input: Partial<PackingInfo> | undefined): PackingInfo {
  return {
    outerBoxP: String(input?.outerBoxP ?? ''),
    outerBoxL: String(input?.outerBoxL ?? ''),
    outerBoxT: String(input?.outerBoxT ?? ''),
    outerBoxVolM3: String(input?.outerBoxVolM3 ?? ''),
    grossWeight: String(input?.grossWeight ?? ''),
    netWeight: String(input?.netWeight ?? ''),
    packingMethod: String(input?.packingMethod ?? 'Carton Box'),
    loadPerContainer20: String(input?.loadPerContainer20 ?? ''),
    loadPerContainer40: String(input?.loadPerContainer40 ?? ''),
    packingCostTotal: String(input?.packingCostTotal ?? ''),
  };
}

function normalizeRows(rows: BomRow[] | undefined): BomRow[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((row) => recomputeRow(normalizeBomRow(row as Partial<BomRow> & { id: string })));
}

function normalizeHardwareRows(rows: HardwareRow[] | undefined): HardwareRow[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((row, index) => ({ ...row, no: row.no || index + 1 }));
}

function normalizeOperations(rows: Operation[] | undefined): Operation[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((row, index) => ({ ...row, no: row.no || index + 1 }));
}

function normalizePackingRows(rows: PackingRow[] | undefined): PackingRow[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((row, index) => ({ ...row, no: row.no || index + 1 }));
}

function getExpiryState(expiryDate: string | Date | null | undefined): ExpiryState {
  const expiry = toDate(expiryDate);
  if (!expiry) return 'active';
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + EXPIRY_SOON_DAYS);
  if (expiry.getTime() < now.getTime()) return 'expired';
  if (expiry.getTime() <= soon.getTime()) return 'expiringSoon';
  return 'active';
}

function getNeedsReviewReasons(input: {
  status: BomWorkflowStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  expiryState: ExpiryState;
}): string[] {
  const reasons: string[] = [];
  const now = Date.now();
  const created = new Date(input.createdAt).getTime();
  const updated = new Date(input.updatedAt).getTime();

  if (input.expiryState === 'expiringSoon') reasons.push('expiring_30_days');
  if ((now - updated) / 86_400_000 > REVIEW_LAST_UPDATE_DAYS) reasons.push('not_revised_6_months');
  if (input.status === 'draft' && (now - created) / 86_400_000 > REVIEW_DRAFT_AGE_DAYS) reasons.push('draft_over_14_days');
  return reasons;
}

function toCostSummary(input: {
  materialCost: number | null | undefined;
  manufactureCost: number | null | undefined;
  hardwareCost: number | null | undefined;
  packingCost: number | null | undefined;
  treatmentCost: number | null | undefined;
  grandTotal: number | null | undefined;
}): BomCostSummary {
  return {
    material: Number(input.materialCost ?? 0),
    manufacture: Number(input.manufactureCost ?? 0),
    hardware: Number(input.hardwareCost ?? 0),
    packing: Number(input.packingCost ?? 0),
    treatment: Number(input.treatmentCost ?? 0),
    grandTotal: Number(input.grandTotal ?? 0),
  };
}

function formatVersion(version: any): BomVersionDTO {
  const metadata = normalizeMetadata(parseJson<Partial<BomMetadata>>(version.metadataJson, {}), '', '');
  const bomRows = normalizeRows(parseJson<BomRow[]>(version.bomRowsJson, []));
  const hardwareRows = normalizeHardwareRows(parseJson<HardwareRow[]>(version.hardwareRowsJson, []));
  const operations = normalizeOperations(parseJson<Operation[]>(version.operationsJson, []));
  const packingRows = normalizePackingRows(parseJson<PackingRow[]>(version.packingRowsJson, []));
  const packingInfo = normalizePackingInfo(parseJson<Partial<PackingInfo>>(version.packingInfoJson, {}));
  return {
    id: version.id,
    versionId: version.versionId,
    version: version.version,
    status: normalizeStatus(version.status),
    isImmutable: Boolean(version.isImmutable),
    createdAt: toIso(version.createdAt),
    updatedAt: toIso(version.updatedAt),
    createdBy: version.createdBy ?? 'system',
    notes: version.notes,
    parentVersionId: version.parentVersionId,
    metadata,
    bomRows,
    hardwareRows,
    operations,
    packingRows,
    packingInfo,
    costSummary: toCostSummary({
      materialCost: version.materialCost,
      manufactureCost: version.manufactureCost,
      hardwareCost: version.hardwareCost,
      packingCost: version.packingCost,
      treatmentCost: version.treatmentCost,
      grandTotal: version.grandTotal,
    }),
  };
}

function toLeadTimeDays(leadTime: string | undefined): number | null {
  const parsed = Number.parseInt(String(leadTime || '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function ensureValidDateRange(metadata: BomMetadata): void {
  if (!metadata.effectiveDate || !metadata.expiryDate) return;
  const effective = toDate(metadata.effectiveDate);
  const expiry = toDate(metadata.expiryDate);
  if (effective && expiry && expiry.getTime() <= effective.getTime()) {
    throw new Error('expiryDate must be greater than effectiveDate');
  }
}

function validateSubmission(metadata: BomMetadata, packingRows: PackingRow[]): void {
  const errors: string[] = [];
  if (!metadata.productType) errors.push('productType is required');
  if (!metadata.leadTime) errors.push('leadTime is required');
  if (!metadata.effectiveDate) errors.push('effectiveDate is required');
  if (!metadata.expiryDate) errors.push('expiryDate is required');
  if (!metadata.productCode?.trim()) errors.push('productCode is required');
  if (!metadata.productName?.trim()) errors.push('productName is required');
  if (packingRows.length === 0) errors.push('Packing data is required before submit/finalize');
  if (metadata.effectiveDate && metadata.expiryDate) {
    const effective = toDate(metadata.effectiveDate);
    const expiry = toDate(metadata.expiryDate);
    if (effective && expiry && expiry.getTime() <= effective.getTime()) {
      errors.push('expiryDate must be greater than effectiveDate');
    }
  }
  if (errors.length > 0) throw new Error(errors.join('; '));
}

function getNextVersionNumber(currentVersion: string): string {
  const [majorRaw, minorRaw] = String(currentVersion || '1.0').split('.');
  const major = Number.parseInt(majorRaw || '1', 10) || 1;
  const minor = (Number.parseInt(minorRaw || '0', 10) || 0) + 1;
  return `${major}.${minor}`;
}

function buildVersionSnapshot(input: {
  code: string;
  name: string;
  metadata?: Partial<BomMetadata>;
  bomRows?: BomRow[];
  hardwareRows?: HardwareRow[];
  operations?: Operation[];
  packingRows?: PackingRow[];
  packingInfo?: Partial<PackingInfo>;
}) {
  const metadata = normalizeMetadata(input.metadata, input.code, input.name);
  ensureValidDateRange(metadata);
  const bomRows = normalizeRows(input.bomRows ?? []);
  const hardwareRows = normalizeHardwareRows(input.hardwareRows ?? []);
  const operations = normalizeOperations(input.operations ?? []);
  const packingRows = normalizePackingRows(input.packingRows ?? []);
  const packingInfo = normalizePackingInfo(input.packingInfo);
  const summary = computeSummary(bomRows, hardwareRows, packingRows);
  return {
    metadata,
    bomRows,
    hardwareRows,
    operations,
    packingRows,
    packingInfo,
    summary,
  };
}

function mapListItem(document: any, version: any): BomListItem {
  const metadata = normalizeMetadata(parseJson<Partial<BomMetadata>>(version?.metadataJson, {}), document.code, document.name);
  const bomRows = parseJson<BomRow[]>(version?.bomRowsJson, []);
  const hardwareRows = parseJson<HardwareRow[]>(version?.hardwareRowsJson, []);
  const productType = normalizeProductType(metadata.productType ?? version?.productType ?? document.productType);
  const effectiveDate = metadata.effectiveDate || toIso(version?.effectiveDate);
  const expiryDate = metadata.expiryDate || toIso(version?.expiryDate);
  const expiryState = getExpiryState(expiryDate);
  const status = normalizeStatus(version?.status ?? 'draft');
  const needsReview = getNeedsReviewReasons({
    status,
    createdAt: version?.createdAt ?? document.createdAt,
    updatedAt: version?.updatedAt ?? document.updatedAt,
    expiryState,
  });
  const costSummary = toCostSummary({
    materialCost: version?.materialCost,
    manufactureCost: version?.manufactureCost,
    hardwareCost: version?.hardwareCost,
    packingCost: version?.packingCost,
    treatmentCost: version?.treatmentCost,
    grandTotal: version?.grandTotal,
  });

  return {
    id: document.id,
    code: document.code,
    name: document.name,
    description: document.description,
    currentVersionId: document.currentVersionId,
    version: version?.version ?? '1.0',
    versionId: version?.versionId ?? '',
    status,
    productType,
    leadTime: metadata.leadTime || String(document.leadTimeDays ?? ''),
    effectiveDate,
    expiryDate,
    expiryState,
    needsReview,
    customer: metadata.customer || '',
    itemType: metadata.itemType || '',
    bomType: metadata.bomType || 'manufacture',
    variant: metadata.productVariant || 'Standard',
    qty: metadata.bomQuantity || '1',
    dimensions: `${metadata.itemWidth || '-'} x ${metadata.itemDepth || '-'} x ${metadata.itemHeight || '-'}`,
    volM3: metadata.volM3 || '',
    modulCount: bomRows.filter((row) => row.levelNum === 0).length,
    subModulCount: bomRows.filter((row) => row.levelNum === 1).length,
    partCount: bomRows.filter((row) => row.levelNum === 2).length,
    hardwareCount: hardwareRows.length,
    costSummary,
    createdAt: toIso(document.createdAt),
    updatedAt: toIso(document.updatedAt),
  };
}

function getActor(actor?: RequestActor): RequestActor {
  return actor ?? DEFAULT_ACTOR;
}

function assertSupervisorOrOwner(actor: RequestActor): void {
  if (actor.role !== 'owner' && actor.role !== 'supervisor') {
    throw new Error('Forbidden: only owner or supervisor can perform this action');
  }
}

function sanitizeCode(code: string): string {
  return code.trim().toUpperCase();
}

async function getDocumentOrThrow(id: string) {
  const document = await db.bomDocument.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!document) throw new Error('BOM Document not found');
  return document;
}

function getCurrentVersion(document: { currentVersionId: string | null; versions: any[] }) {
  const current =
    (document.currentVersionId ? document.versions.find((version) => version.id === document.currentVersionId) : null) ||
    document.versions[document.versions.length - 1];
  if (!current) throw new Error('BOM version not found');
  return current;
}

async function ensureUniqueCode(code: string, exceptDocumentId?: string): Promise<void> {
  const existing = await db.bomDocument.findUnique({ where: { code } });
  if (existing && existing.id !== exceptDocumentId) {
    throw new Error(`BOM code ${code} already exists`);
  }
}

async function getApproverEmails(): Promise<string[]> {
  const users = await db.user.findMany({
    where: {
      role: { in: APPROVER_ROLES },
    },
    select: { email: true },
  });
  const fromUsers = users.map((item) => item.email || '').filter(Boolean);
  if (fromUsers.length > 0) return Array.from(new Set(fromUsers));
  const envEmails = String(process.env.APPROVER_EMAILS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(envEmails));
}

async function getOwnerEmails(): Promise<string[]> {
  const users = await db.user.findMany({
    where: {
      role: UserRole.owner,
    },
    select: { email: true },
  });
  const fromUsers = users.map((item) => item.email || '').filter(Boolean);
  if (fromUsers.length > 0) return Array.from(new Set(fromUsers));
  const envEmails = String(process.env.OWNER_EMAILS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(envEmails));
}

export async function logAction(
  documentId: string,
  action: string,
  userId: string,
  details?: string | null,
  versionId?: string | null,
): Promise<void> {
  if (!documentId) return;
  await db.auditLog.create({
    data: {
      documentId,
      versionId: versionId ?? null,
      action,
      userId: userId || 'system',
      details: details || null,
    },
  });
}

export async function getAllBomDocuments(filters: BomListFilters = {}): Promise<BomListItem[]> {
  const where: Prisma.BomDocumentWhereInput = {};
  if (filters.q) {
    where.OR = [
      { code: { contains: filters.q } },
      { name: { contains: filters.q } },
    ];
  }

  const documents = await db.bomDocument.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      currentVersionId: true,
      productType: true,
      leadTimeDays: true,
      effectiveDate: true,
      expiryDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const currentIds = Array.from(new Set(documents.map((document) => document.currentVersionId).filter(Boolean))) as string[];
  const versions = currentIds.length
    ? await db.bomVersion.findMany({
        where: { id: { in: currentIds } },
        select: {
          id: true,
          versionId: true,
          version: true,
          status: true,
          metadataJson: true,
          bomRowsJson: true,
          hardwareRowsJson: true,
          materialCost: true,
          manufactureCost: true,
          hardwareCost: true,
          packingCost: true,
          treatmentCost: true,
          grandTotal: true,
          productType: true,
          effectiveDate: true,
          expiryDate: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    : [];
  const byId = new Map(versions.map((version) => [version.id, version]));
  let items = documents.map((document) => mapListItem(document, byId.get(document.currentVersionId || '')));

  if (filters.status) {
    items = items.filter((item) => item.status === filters.status);
  }
  if (filters.productType) {
    items = items.filter((item) => item.productType === filters.productType);
  }
  if (filters.expiryState) {
    items = items.filter((item) => item.expiryState === filters.expiryState);
  }
  if (typeof filters.needsReview === 'boolean') {
    items = items.filter((item) => (filters.needsReview ? item.needsReview.length > 0 : item.needsReview.length === 0));
  }

  return items;
}

export async function searchBomDocuments(query: string): Promise<BomListItem[]> {
  return getAllBomDocuments({ q: query });
}

export async function getBomDocument(id: string): Promise<BomDocumentDTO | null> {
  const document = await db.bomDocument.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!document) return null;
  const versions = document.versions.map(formatVersion);
  const current = versions.find((version) => version.id === document.currentVersionId) || versions[versions.length - 1];
  if (!current) return null;
  const expiryState = getExpiryState(current.metadata.expiryDate || document.expiryDate);
  const needsReview = getNeedsReviewReasons({
    status: current.status,
    createdAt: current.createdAt,
    updatedAt: current.updatedAt,
    expiryState,
  });
  return {
    id: document.id,
    code: document.code,
    name: document.name,
    description: document.description,
    currentVersionId: document.currentVersionId,
    productType: normalizeProductType(current.metadata.productType || document.productType),
    leadTime: current.metadata.leadTime || String(document.leadTimeDays ?? ''),
    effectiveDate: current.metadata.effectiveDate || toIso(document.effectiveDate),
    expiryDate: current.metadata.expiryDate || toIso(document.expiryDate),
    expiryState,
    needsReview,
    costSummary: current.costSummary,
    versions,
    createdAt: toIso(document.createdAt),
    updatedAt: toIso(document.updatedAt),
  };
}

export async function createBomDocument(input: CreateBomInput, actor?: RequestActor): Promise<BomDocumentDTO> {
  const bomCode = sanitizeCode(input.code || '');
  const bomName = String(input.name || '').trim();
  if (!bomCode) throw new Error('Code is required');
  if (!bomName) throw new Error('Name is required');
  await ensureUniqueCode(bomCode);

  const snapshot = buildVersionSnapshot({
    code: bomCode,
    name: bomName,
    metadata: input.metadata,
    bomRows: input.bomRows,
    hardwareRows: input.hardwareRows,
    operations: input.operations,
    packingRows: input.packingRows,
    packingInfo: input.packingInfo,
  });
  const actorResolved = getActor(actor);
  const creator = input.createdBy || actorResolved.id || 'system';

  const result = await db.$transaction(async (tx) => {
    const document = await tx.bomDocument.create({
      data: {
        code: bomCode,
        name: bomName,
        description: input.description || null,
        productType: toPrismaProductType(snapshot.metadata.productType),
        leadTimeDays: toLeadTimeDays(snapshot.metadata.leadTime),
        effectiveDate: toDate(snapshot.metadata.effectiveDate),
        expiryDate: toDate(snapshot.metadata.expiryDate),
      },
    });
    const version = await tx.bomVersion.create({
      data: {
        version: '1.0',
        status: BomStatus.draft,
        documentId: document.id,
        createdBy: creator,
        notes: 'Initial version',
        metadataJson: JSON.stringify(snapshot.metadata),
        bomRowsJson: JSON.stringify(snapshot.bomRows),
        hardwareRowsJson: JSON.stringify(snapshot.hardwareRows),
        operationsJson: JSON.stringify(snapshot.operations),
        packingRowsJson: JSON.stringify(snapshot.packingRows),
        packingInfoJson: JSON.stringify(snapshot.packingInfo),
        productType: toPrismaProductType(snapshot.metadata.productType),
        leadTimeDays: toLeadTimeDays(snapshot.metadata.leadTime),
        effectiveDate: toDate(snapshot.metadata.effectiveDate),
        expiryDate: toDate(snapshot.metadata.expiryDate),
        materialCost: snapshot.summary.biayaSatuan,
        manufactureCost: snapshot.summary.mfgCost,
        hardwareCost: snapshot.summary.hardwareCost,
        packingCost: snapshot.summary.packingCost,
        treatmentCost: snapshot.summary.treatmentCost,
        grandTotal: snapshot.summary.grand,
      },
    });
    await tx.bomDocument.update({
      where: { id: document.id },
      data: { currentVersionId: version.id },
    });
    await tx.auditLog.create({
      data: {
        documentId: document.id,
        versionId: version.id,
        action: 'CREATE',
        userId: creator,
        details: `Created BOM ${bomCode}`,
      },
    });
    return { documentId: document.id };
  });

  const latest = await getBomDocument(result.documentId);
  if (!latest) throw new Error('Failed to load BOM after create');
  return latest;
}

export async function updateBomVersion(documentId: string, input: UpdateBomInput, actor?: RequestActor): Promise<BomVersionDTO> {
  const document = await getDocumentOrThrow(documentId);
  const current = getCurrentVersion(document);
  const currentStatus = normalizeStatus(current.status);
  if (currentStatus === 'final' || currentStatus === 'archived' || current.isImmutable) {
    throw new Error('Current version is immutable and cannot be edited');
  }

  const currentMetadata = normalizeMetadata(parseJson<Partial<BomMetadata>>(current.metadataJson, {}), document.code, document.name);
  const currentRows = parseJson<BomRow[]>(current.bomRowsJson, []);
  const currentHardware = parseJson<HardwareRow[]>(current.hardwareRowsJson, []);
  const currentOperations = parseJson<Operation[]>(current.operationsJson, []);
  const currentPackingRows = parseJson<PackingRow[]>(current.packingRowsJson, []);
  const currentPackingInfo = parseJson<Partial<PackingInfo>>(current.packingInfoJson, {});

  const nextSnapshot = buildVersionSnapshot({
    code: input.metadata?.productCode || currentMetadata.productCode || document.code,
    name: input.metadata?.productName || currentMetadata.productName || document.name,
    metadata: { ...currentMetadata, ...input.metadata },
    bomRows: input.bomRows ?? currentRows,
    hardwareRows: input.hardwareRows ?? currentHardware,
    operations: input.operations ?? currentOperations,
    packingRows: input.packingRows ?? currentPackingRows,
    packingInfo: { ...currentPackingInfo, ...input.packingInfo },
  });
  const actorResolved = getActor(actor);
  const nextCode = sanitizeCode(nextSnapshot.metadata.productCode || document.code);
  if (nextCode !== document.code) await ensureUniqueCode(nextCode, document.id);

  const updated = await db.$transaction(async (tx) => {
    await tx.bomDocument.update({
      where: { id: documentId },
      data: {
        code: nextCode,
        name: nextSnapshot.metadata.productName || document.name,
        productType: toPrismaProductType(nextSnapshot.metadata.productType),
        leadTimeDays: toLeadTimeDays(nextSnapshot.metadata.leadTime),
        effectiveDate: toDate(nextSnapshot.metadata.effectiveDate),
        expiryDate: toDate(nextSnapshot.metadata.expiryDate),
      },
    });
    const version = await tx.bomVersion.update({
      where: { id: current.id },
      data: {
        metadataJson: JSON.stringify(nextSnapshot.metadata),
        bomRowsJson: JSON.stringify(nextSnapshot.bomRows),
        hardwareRowsJson: JSON.stringify(nextSnapshot.hardwareRows),
        operationsJson: JSON.stringify(nextSnapshot.operations),
        packingRowsJson: JSON.stringify(nextSnapshot.packingRows),
        packingInfoJson: JSON.stringify(nextSnapshot.packingInfo),
        notes: input.notes ?? current.notes,
        productType: toPrismaProductType(nextSnapshot.metadata.productType),
        leadTimeDays: toLeadTimeDays(nextSnapshot.metadata.leadTime),
        effectiveDate: toDate(nextSnapshot.metadata.effectiveDate),
        expiryDate: toDate(nextSnapshot.metadata.expiryDate),
        materialCost: nextSnapshot.summary.biayaSatuan,
        manufactureCost: nextSnapshot.summary.mfgCost,
        hardwareCost: nextSnapshot.summary.hardwareCost,
        packingCost: nextSnapshot.summary.packingCost,
        treatmentCost: nextSnapshot.summary.treatmentCost,
        grandTotal: nextSnapshot.summary.grand,
      },
    });
    await tx.auditLog.create({
      data: {
        documentId,
        versionId: current.id,
        action: 'UPDATE',
        userId: actorResolved.id,
        details: 'Updated current BOM version',
      },
    });
    return version;
  });

  return formatVersion(updated);
}

export async function deleteBomDocument(id: string): Promise<{ deleted: boolean }> {
  await db.bomDocument.delete({ where: { id } });
  return { deleted: true };
}

export async function createNewVersion(documentId: string, input: CreateVersionInput = {}, actor?: RequestActor): Promise<BomVersionDTO> {
  const document = await getDocumentOrThrow(documentId);
  const current = getCurrentVersion(document);
  const currentMetadata = parseJson<Partial<BomMetadata>>(current.metadataJson, {});
  const snapshot = buildVersionSnapshot({
    code: input.metadata?.productCode || currentMetadata.productCode || document.code,
    name: input.metadata?.productName || currentMetadata.productName || document.name,
    metadata: { ...currentMetadata, ...input.metadata },
    bomRows: input.bomRows ?? parseJson<BomRow[]>(current.bomRowsJson, []),
    hardwareRows: input.hardwareRows ?? parseJson<HardwareRow[]>(current.hardwareRowsJson, []),
    operations: input.operations ?? parseJson<Operation[]>(current.operationsJson, []),
    packingRows: input.packingRows ?? parseJson<PackingRow[]>(current.packingRowsJson, []),
    packingInfo: { ...parseJson<Partial<PackingInfo>>(current.packingInfoJson, {}), ...input.packingInfo },
  });
  const actorResolved = getActor(actor);
  const status = normalizeStatus(input.status ?? 'draft');
  const created = await db.$transaction(async (tx) => {
    const version = await tx.bomVersion.create({
      data: {
        version: input.version || getNextVersionNumber(current.version),
        status: toPrismaStatus(status),
        documentId: document.id,
        parentVersionId: current.id,
        createdBy: input.createdBy || actorResolved.id,
        notes: input.notes ?? '',
        metadataJson: JSON.stringify(snapshot.metadata),
        bomRowsJson: JSON.stringify(snapshot.bomRows),
        hardwareRowsJson: JSON.stringify(snapshot.hardwareRows),
        operationsJson: JSON.stringify(snapshot.operations),
        packingRowsJson: JSON.stringify(snapshot.packingRows),
        packingInfoJson: JSON.stringify(snapshot.packingInfo),
        productType: toPrismaProductType(snapshot.metadata.productType),
        leadTimeDays: toLeadTimeDays(snapshot.metadata.leadTime),
        effectiveDate: toDate(snapshot.metadata.effectiveDate),
        expiryDate: toDate(snapshot.metadata.expiryDate),
        materialCost: snapshot.summary.biayaSatuan,
        manufactureCost: snapshot.summary.mfgCost,
        hardwareCost: snapshot.summary.hardwareCost,
        packingCost: snapshot.summary.packingCost,
        treatmentCost: snapshot.summary.treatmentCost,
        grandTotal: snapshot.summary.grand,
      },
    });
    await tx.bomDocument.update({
      where: { id: document.id },
      data: {
        currentVersionId: version.id,
        code: sanitizeCode(snapshot.metadata.productCode || document.code),
        name: snapshot.metadata.productName || document.name,
        productType: toPrismaProductType(snapshot.metadata.productType),
        leadTimeDays: toLeadTimeDays(snapshot.metadata.leadTime),
        effectiveDate: toDate(snapshot.metadata.effectiveDate),
        expiryDate: toDate(snapshot.metadata.expiryDate),
      },
    });
    await tx.auditLog.create({
      data: {
        documentId,
        versionId: version.id,
        action: 'CREATE_VERSION',
        userId: actorResolved.id,
        details: `Created version ${version.version}`,
      },
    });
    return version;
  });
  return formatVersion(created);
}

export async function updateVersionStatus(versionId: string, status: BomWorkflowStatus): Promise<BomVersionDTO> {
  const prismaStatus = toPrismaStatus(normalizeStatus(status));
  const updated = await db.bomVersion.update({
    where: { versionId },
    data: {
      status: prismaStatus,
      isImmutable: prismaStatus === BomStatus.final ? true : undefined,
    },
  });
  return formatVersion(updated);
}

export async function submitReview(documentId: string, actor?: RequestActor, comment?: string): Promise<BomVersionDTO> {
  const actorResolved = getActor(actor);
  const document = await getDocumentOrThrow(documentId);
  const current = getCurrentVersion(document);
  const status = normalizeStatus(current.status);
  if (status !== 'draft') {
    throw new Error('Only draft version can be submitted for review');
  }
  const metadata = normalizeMetadata(parseJson<Partial<BomMetadata>>(current.metadataJson, {}), document.code, document.name);
  const packingRows = normalizePackingRows(parseJson<PackingRow[]>(current.packingRowsJson, []));
  validateSubmission(metadata, packingRows);

  const updated = await db.$transaction(async (tx) => {
    const version = await tx.bomVersion.update({
      where: { id: current.id },
      data: { status: BomStatus.submitted },
    });
    await tx.auditLog.create({
      data: {
        documentId,
        versionId: current.id,
        action: 'SUBMIT_REVIEW',
        userId: actorResolved.id,
        details: comment || 'Submitted for review',
      },
    });
    await tx.approvalHistory.create({
      data: {
        documentId,
        versionId: current.id,
        action: 'submit',
        actorId: actorResolved.id,
        actorRole: actorResolved.role,
        comment: comment || null,
      },
    });
    return version;
  });

  const approvers = await getApproverEmails();
  if (approvers.length > 0) {
    const appBaseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';
    const reviewUrl = appBaseUrl ? `${appBaseUrl.replace(/\/$/, '')}/bom/${document.id}` : `/bom/${document.id}`;
    await sendApprovalRequestEmail({
      bomCode: document.code,
      bomName: document.name,
      reviewUrl,
      recipients: approvers,
    });
  }

  return formatVersion(updated);
}

export async function approve(documentId: string, actor?: RequestActor, comment?: string): Promise<BomVersionDTO> {
  const actorResolved = getActor(actor);
  assertSupervisorOrOwner(actorResolved);
  const document = await getDocumentOrThrow(documentId);
  const current = getCurrentVersion(document);
  if (normalizeStatus(current.status) !== 'submitted') {
    throw new Error('Only submitted version can be approved');
  }
  const updated = await db.$transaction(async (tx) => {
    const version = await tx.bomVersion.update({
      where: { id: current.id },
      data: { status: BomStatus.approved },
    });
    await tx.auditLog.create({
      data: {
        documentId,
        versionId: current.id,
        action: 'APPROVE',
        userId: actorResolved.id,
        details: comment || null,
      },
    });
    await tx.approvalHistory.create({
      data: {
        documentId,
        versionId: current.id,
        action: 'approve',
        actorId: actorResolved.id,
        actorRole: actorResolved.role,
        comment: comment || null,
      },
    });
    return version;
  });
  return formatVersion(updated);
}

export async function reject(documentId: string, actor?: RequestActor, comment?: string): Promise<BomVersionDTO> {
  const actorResolved = getActor(actor);
  assertSupervisorOrOwner(actorResolved);
  if (!comment || !comment.trim()) {
    throw new Error('Reject comment is required');
  }
  const document = await getDocumentOrThrow(documentId);
  const current = getCurrentVersion(document);
  if (normalizeStatus(current.status) !== 'submitted') {
    throw new Error('Only submitted version can be rejected');
  }
  const updated = await db.$transaction(async (tx) => {
    const version = await tx.bomVersion.update({
      where: { id: current.id },
      data: { status: BomStatus.draft },
    });
    await tx.auditLog.create({
      data: {
        documentId,
        versionId: current.id,
        action: 'REJECT',
        userId: actorResolved.id,
        details: comment,
      },
    });
    await tx.approvalHistory.create({
      data: {
        documentId,
        versionId: current.id,
        action: 'reject',
        actorId: actorResolved.id,
        actorRole: actorResolved.role,
        comment,
      },
    });
    return version;
  });
  return formatVersion(updated);
}

export async function finalize(documentId: string, actor?: RequestActor, comment?: string): Promise<BomVersionDTO> {
  const actorResolved = getActor(actor);
  assertSupervisorOrOwner(actorResolved);
  const document = await getDocumentOrThrow(documentId);
  const current = getCurrentVersion(document);
  if (normalizeStatus(current.status) !== 'approved') {
    throw new Error('Only approved version can be finalized');
  }
  const metadata = normalizeMetadata(parseJson<Partial<BomMetadata>>(current.metadataJson, {}), document.code, document.name);
  const packingRows = normalizePackingRows(parseJson<PackingRow[]>(current.packingRowsJson, []));
  validateSubmission(metadata, packingRows);

  const updated = await db.$transaction(async (tx) => {
    const version = await tx.bomVersion.update({
      where: { id: current.id },
      data: {
        status: BomStatus.final,
        isImmutable: true,
      },
    });
    await tx.auditLog.create({
      data: {
        documentId,
        versionId: current.id,
        action: 'FINALIZE',
        userId: actorResolved.id,
        details: comment || 'Finalized BOM version',
      },
    });
    await tx.approvalHistory.create({
      data: {
        documentId,
        versionId: current.id,
        action: 'finalize',
        actorId: actorResolved.id,
        actorRole: actorResolved.role,
        comment: comment || null,
      },
    });
    return version;
  });

  return formatVersion(updated);
}

function normalizeExportFormat(format: string | undefined): BomExportFormat {
  if (format === 'pdf' || format === 'excel' || format === 'both') return format;
  throw new Error('Invalid export format. Allowed values: pdf, excel, both');
}

function buildCsv(version: BomVersionDTO, document: { code: string; name: string }): string {
  const pricing = computePricingFromMetadata(version.costSummary.grandTotal, version.metadata);
  const header = ['No', 'Part Code', 'Description', 'Qty', 'Scrap%', 'Qty Actual', 'Material Cost', 'Manufacture Cost'];
  const rows = version.bomRows.map((row) => {
    const qty = toNum(row.qty);
    const scrap = toNum(row.scrapPercent);
    const qtyActual = toNum(row.qtyActual || qty * (1 + scrap / 100));
    const materialCost = toNum(row.biayaSatuan) * qtyActual;
    const mfg = toNum(row.totalManufactureCost) > 0 ? toNum(row.totalManufactureCost) : toNum(row.workCenterCost) + toNum(row.routingCost);
    return [row.no, row.partCode, row.description || row.modul, qty, scrap, qtyActual.toFixed(2), materialCost.toFixed(2), mfg.toFixed(2)];
  });
  return [
    `BOM Code,${document.code}`,
    `BOM Name,${document.name}`,
    `Version,${version.version}`,
    `Status,${version.status.toUpperCase()}`,
    `COGS,${pricing.cogs.toFixed(2)}`,
    `Markup Percent,${pricing.markupPercent.toFixed(2)}`,
    `Selling Price,${pricing.sellingPrice.toFixed(2)}`,
    `Margin Percent,${pricing.marginPercent.toFixed(2)}`,
    `Selling Price (USD),${pricing.sellingPriceUsd.toFixed(2)}`,
    '',
    header.join(','),
    ...rows.map((row) => row.map((item) => `"${String(item ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
}

function buildPdfLikeText(version: BomVersionDTO, document: { code: string; name: string }, procurement: any): string {
  const pricing = computePricingFromMetadata(version.costSummary.grandTotal, version.metadata);
  const lines: string[] = [];
  lines.push('BOM EXPORT');
  lines.push(`WATERMARK: ${version.status.toUpperCase()}`);
  lines.push(`BOM: ${document.code} - ${document.name}`);
  lines.push(`VERSION: ${version.version}`);
  lines.push(`PRODUCT TYPE: ${version.metadata.productType || 'Standard'}`);
  lines.push(`LEAD TIME: ${version.metadata.leadTime || '-'}`);
  lines.push(`EFFECTIVE DATE: ${version.metadata.effectiveDate || '-'}`);
  lines.push(`EXPIRY DATE: ${version.metadata.expiryDate || '-'}`);
  lines.push('');
  lines.push(`MATERIAL: ${version.costSummary.material.toFixed(2)}`);
  lines.push(`MANUFACTURE: ${version.costSummary.manufacture.toFixed(2)}`);
  lines.push(`HARDWARE: ${version.costSummary.hardware.toFixed(2)}`);
  lines.push(`PACKING: ${version.costSummary.packing.toFixed(2)}`);
  lines.push(`GRAND TOTAL: ${version.costSummary.grandTotal.toFixed(2)}`);
  lines.push(`COGS: ${pricing.cogs.toFixed(2)}`);
  lines.push(`MARKUP %: ${pricing.markupPercent.toFixed(2)}`);
  lines.push(`SELLING PRICE: ${pricing.sellingPrice.toFixed(2)}`);
  lines.push(`MARGIN %: ${pricing.marginPercent.toFixed(2)}`);
  lines.push(`SELLING PRICE USD: ${pricing.sellingPriceUsd.toFixed(2)}`);
  lines.push('');
  lines.push('PROCUREMENT SNAPSHOT');
  lines.push(`Source: ${procurement.source}`);
  lines.push(`Hardware Cost: ${procurement.hardwareCost.toFixed(2)}`);
  lines.push(`Packing Cost: ${procurement.packingCost.toFixed(2)}`);
  lines.push(`3D Image Rows Available: ${version.bomRows.filter((row) => Boolean(row.imageUrl)).length}`);
  return lines.join('\n');
}

export async function exportBom(documentId: string, formatInput: string, actor?: RequestActor) {
  const actorResolved = getActor(actor);
  const format = normalizeExportFormat(formatInput);
  const document = await getDocumentOrThrow(documentId);
  const current = formatVersion(getCurrentVersion(document));
  if (current.status !== 'final') {
    throw new Error('Export is only allowed for final BOM');
  }
  const procurement = await getProcurementSnapshot({
    bomId: document.id,
    bomCode: document.code,
    hardwareRows: current.hardwareRows,
    packingRows: current.packingRows,
  });
  const timestamp = new Date();
  const dateSegment = [
    timestamp.getFullYear(),
    String(timestamp.getMonth() + 1).padStart(2, '0'),
    String(timestamp.getDate()).padStart(2, '0'),
  ].join('');
  const baseName = `${document.code}_${current.version}_${dateSegment}`;
  const files: Array<{ name: string; mimeType: string; contentBase64: string }> = [];

  if (format === 'pdf' || format === 'both') {
    const text = buildPdfLikeText(current, document, procurement);
    files.push({
      name: `${baseName}.pdf.txt`,
      mimeType: 'text/plain',
      contentBase64: Buffer.from(text, 'utf8').toString('base64'),
    });
  }
  if (format === 'excel' || format === 'both') {
    const csv = buildCsv(current, document);
    files.push({
      name: `${baseName}.csv`,
      mimeType: 'text/csv',
      contentBase64: Buffer.from(csv, 'utf8').toString('base64'),
    });
  }

  await db.auditLog.create({
    data: {
      documentId,
      versionId: current.id,
      action: 'EXPORT',
      userId: actorResolved.id,
      details: JSON.stringify({ format, files: files.map((file) => file.name) }),
    },
  });

  return {
    format,
    watermark: current.status.toUpperCase(),
    generatedAt: new Date().toISOString(),
    filenamePattern: `${document.code}_${current.version}_${dateSegment}`,
    files,
  };
}

export async function getUsedInWo(documentId: string) {
  const document = await db.bomDocument.findUnique({
    where: { id: documentId },
    select: { id: true, code: true, name: true },
  });
  if (!document) throw new Error('BOM Document not found');
  const usage = await getWorkOrderUsage({ bomId: document.id, bomCode: document.code });
  return {
    bomId: document.id,
    bomCode: document.code,
    bomName: document.name,
    count: usage.count,
    items: usage.items,
    source: usage.source,
  };
}

function aggregateStock(items: Array<{ qtyRequired: number; qtyAvailable: number; stockStatus: string }>) {
  const qtyRequired = items.reduce((sum, item) => sum + item.qtyRequired, 0);
  const qtyAvailable = items.reduce((sum, item) => sum + item.qtyAvailable, 0);
  let stockStatus: 'available' | 'low' | 'out' = 'available';
  if (items.some((item) => item.stockStatus === 'out')) stockStatus = 'out';
  else if (items.some((item) => item.stockStatus === 'low')) stockStatus = 'low';
  return { qtyRequired, qtyAvailable, stockStatus };
}

export async function getStockStatus(documentId: string) {
  const document = await getDocumentOrThrow(documentId);
  const current = getCurrentVersion(document);
  const rows = normalizeRows(parseJson<BomRow[]>(current.bomRowsJson, []));
  const stocks = await getComponentStocks(rows);
  const aggregate = aggregateStock(stocks.items);
  return {
    bomId: document.id,
    bomCode: document.code,
    qtyRequired: aggregate.qtyRequired,
    qtyAvailable: aggregate.qtyAvailable,
    stockStatus: aggregate.stockStatus,
    components: stocks.items.map((item) => ({
      partCode: item.partCode,
      qtyRequired: item.qtyRequired,
      qtyAvailable: item.qtyAvailable,
      stockStatus: item.stockStatus,
      warehouses: item.warehouses,
    })),
    source: stocks.source,
  };
}

export async function getDocumentHistory(documentId: string) {
  const [auditLogs, approvals] = await Promise.all([
    db.auditLog.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    }),
    db.approvalHistory.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return { auditLogs, approvals };
}

function parseNeedsReviewFilter(value: string | null): boolean | undefined {
  if (value == null || value === '') return undefined;
  if (value === '1' || value.toLowerCase() === 'true') return true;
  if (value === '0' || value.toLowerCase() === 'false') return false;
  return undefined;
}

export function parseListFilters(params: URLSearchParams): BomListFilters {
  const statusRaw = params.get('status');
  const productTypeRaw = params.get('productType');
  const expiryRaw = params.get('expiryState');
  const filters: BomListFilters = {
    q: params.get('q') || undefined,
    status: statusRaw ? normalizeStatus(statusRaw) : undefined,
    productType: productTypeRaw ? normalizeProductType(productTypeRaw) : undefined,
    needsReview: parseNeedsReviewFilter(params.get('needsReview')),
  };
  if (expiryRaw === 'active' || expiryRaw === 'expired' || expiryRaw === 'expiringSoon') {
    filters.expiryState = expiryRaw;
  }
  return filters;
}

interface LegacyVersionLike {
  version?: string;
  status?: string;
  metadata?: Partial<BomMetadata>;
  bomRows?: BomRow[];
  hardwareRows?: HardwareRow[];
  operations?: Operation[];
  packingRows?: PackingRow[];
  packingInfo?: Partial<PackingInfo>;
}

interface LegacyDocumentLike {
  code?: string;
  name?: string;
  description?: string;
  metadata?: Partial<BomMetadata>;
  bomRows?: BomRow[];
  hardwareRows?: HardwareRow[];
  operations?: Operation[];
  packingRows?: PackingRow[];
  packingInfo?: Partial<PackingInfo>;
  currentVersionId?: string;
  versions?: LegacyVersionLike[];
}

function pickLegacyCurrentVersion(doc: LegacyDocumentLike): LegacyVersionLike {
  if (!Array.isArray(doc.versions) || doc.versions.length === 0) {
    return {
      metadata: doc.metadata,
      bomRows: doc.bomRows,
      hardwareRows: doc.hardwareRows,
      operations: doc.operations,
      packingRows: doc.packingRows,
      packingInfo: doc.packingInfo,
      version: '1.0',
      status: 'draft',
    };
  }
  return doc.versions[doc.versions.length - 1];
}

function toLegacyDocs(payload: LegacyMigrationPayload): LegacyDocumentLike[] {
  const docs: LegacyDocumentLike[] = [];
  if (Array.isArray(payload.docs)) {
    payload.docs.forEach((item) => docs.push(item as LegacyDocumentLike));
  }
  if (payload.legacyState && typeof payload.legacyState === 'object') {
    const raw = payload.legacyState as any;
    if (raw.metadata || raw.bomRows) {
      docs.push({
        code: raw.metadata?.productCode,
        name: raw.metadata?.productName,
        metadata: raw.metadata,
        bomRows: raw.bomRows,
        hardwareRows: raw.hardwareRows,
        operations: raw.operations,
        packingRows: raw.packingRows,
        packingInfo: raw.packingInfo,
      });
    }
  }
  return docs;
}

export async function migrateLocalDocuments(payload: LegacyMigrationPayload, actor?: RequestActor) {
  const actorResolved = getActor(actor);
  const docs = toLegacyDocs(payload);
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const legacyDoc of docs) {
    try {
      const current = pickLegacyCurrentVersion(legacyDoc);
      const metadata = normalizeMetadata(current.metadata || legacyDoc.metadata, legacyDoc.code, legacyDoc.name);
      const code = sanitizeCode(legacyDoc.code || metadata.productCode || '');
      const name = String(legacyDoc.name || metadata.productName || '').trim();
      if (!code || !name) {
        skipped += 1;
        continue;
      }
      const exists = await db.bomDocument.findUnique({ where: { code }, select: { id: true } });
      if (exists) {
        skipped += 1;
        continue;
      }
      await createBomDocument(
        {
          code,
          name,
          description: legacyDoc.description,
          metadata,
          bomRows: current.bomRows || legacyDoc.bomRows || [],
          hardwareRows: current.hardwareRows || legacyDoc.hardwareRows || [],
          operations: current.operations || legacyDoc.operations || [],
          packingRows: current.packingRows || legacyDoc.packingRows || [],
          packingInfo: current.packingInfo || legacyDoc.packingInfo || {},
          createdBy: actorResolved.id,
        },
        actorResolved,
      );
      imported += 1;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown migration error');
    }
  }

  return {
    imported,
    skipped,
    total: docs.length,
    errors,
  };
}

function isMonday0900Wib(date: Date): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const lookup = new Map(parts.map((item) => [item.type, item.value]));
  return lookup.get('weekday') === 'Mon' && lookup.get('hour') === '09' && lookup.get('minute') === '00';
}

export async function runWeeklyOwnerSummary(input?: { force?: boolean }) {
  const now = new Date();
  const force = Boolean(input?.force);
  if (!force && !isMonday0900Wib(now)) {
    return { sent: false, reason: 'Outside Monday 09:00 WIB window', checkedAt: now.toISOString() };
  }
  const list = await getAllBomDocuments({});
  const rows = list
    .filter((item) => item.needsReview.length > 0)
    .map((item) => ({
      bomCode: item.code,
      bomName: item.name,
      reasons: item.needsReview,
    }));
  const ownerEmails = await getOwnerEmails();
  if (ownerEmails.length === 0) {
    return { sent: false, reason: 'No owner recipients configured', checkedAt: now.toISOString(), rows: rows.length };
  }
  await sendWeeklyOwnerSummary({
    ownerEmails,
    summaryRows: rows,
  });
  return {
    sent: true,
    checkedAt: now.toISOString(),
    recipients: ownerEmails.length,
    rows: rows.length,
  };
}
