import type { BomMetadata, BomRow, HardwareRow, Operation, PackingInfo, PackingRow } from '@/types';
import { computeSummary, recomputeRow } from '@/lib/calculations';
import { normalizeBomRow } from '@/lib/normalizeBomRow';

export type BomStatus = 'draft' | 'submitted' | 'approved' | 'final' | 'archived';
export type ProductType = 'Standard' | 'Custom' | 'Export' | 'OEM';
export type ExpiryState = 'active' | 'expired' | 'expiringSoon';

export interface BomCostSummary {
  material: number;
  manufacture: number;
  hardware: number;
  packing: number;
  treatment: number;
  grandTotal: number;
}

export interface BomListItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  currentVersionId: string | null;
  version: string;
  versionId: string;
  status: BomStatus;
  productType: ProductType;
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

export interface BomVersionDetail {
  id: string;
  versionId: string;
  version: string;
  status: BomStatus;
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

export interface BomDocumentDetail {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  currentVersionId: string | null;
  productType: ProductType;
  leadTime: string;
  effectiveDate: string;
  expiryDate: string;
  expiryState: ExpiryState;
  needsReview: string[];
  costSummary: BomCostSummary;
  versions: BomVersionDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBomPayload {
  code: string;
  name: string;
  description?: string;
  metadata?: Partial<BomMetadata>;
  bomRows?: BomRow[];
  hardwareRows?: HardwareRow[];
  operations?: Operation[];
  packingRows?: PackingRow[];
  packingInfo?: Partial<PackingInfo>;
}

export interface UpdateBomPayload {
  metadata?: Partial<BomMetadata>;
  bomRows?: BomRow[];
  hardwareRows?: HardwareRow[];
  operations?: Operation[];
  packingRows?: PackingRow[];
  packingInfo?: Partial<PackingInfo>;
  notes?: string;
}

export interface CreateVersionPayload extends UpdateBomPayload {
  version?: string;
  status?: BomStatus;
}

export interface BomFilters {
  q?: string;
  status?: BomStatus;
  productType?: ProductType;
  expiryState?: ExpiryState;
  needsReview?: boolean;
}

export interface WorkOrderUsageResponse {
  bomId: string;
  bomCode: string;
  bomName: string;
  count: number;
  items: Array<{
    id: string;
    code: string;
    status: string;
    qty?: number;
    plannedStart?: string;
  }>;
  source: 'integration' | 'fallback';
}

export interface StockStatusResponse {
  bomId: string;
  bomCode: string;
  qtyRequired: number;
  qtyAvailable: number;
  stockStatus: 'available' | 'low' | 'out';
  components: Array<{
    partCode: string;
    qtyRequired: number;
    qtyAvailable: number;
    stockStatus: 'available' | 'low' | 'out';
    warehouses: Array<{
      warehouseId: string;
      warehouseName: string;
      qtyAvailable: number;
    }>;
  }>;
  source: 'integration' | 'fallback';
}

export interface ExportResponse {
  format: 'pdf' | 'excel' | 'both';
  watermark: string;
  generatedAt: string;
  filenamePattern: string;
  files: Array<{
    name: string;
    mimeType: string;
    contentBase64: string;
  }>;
}

export interface AuditHistoryResponse {
  auditLogs: Array<{
    id: string;
    documentId: string;
    versionId: string | null;
    action: string;
    userId: string;
    details: string | null;
    createdAt: string;
  }>;
  approvals: Array<{
    id: string;
    documentId: string;
    versionId: string | null;
    action: 'submit' | 'approve' | 'reject' | 'finalize';
    actorId: string;
    actorRole: string;
    comment: string | null;
    createdAt: string;
  }>;
}

type LocalDocument = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  currentVersionId: string | null;
  versions: BomVersionDetail[];
  createdAt: string;
  updatedAt: string;
};

const DOCS_KEY = 'bom-app-documents';
const LEGACY_STATE_KEY = 'bom-app-state';
const PRODUCT_TYPES: ProductType[] = ['Standard', 'Custom', 'Export', 'OEM'];
const APPROVER_ROLES = new Set(['owner', 'supervisor']);

function getStorage(): Storage {
  if (typeof window === 'undefined') {
    throw new Error('Mode frontend-only hanya tersedia di browser');
  }
  return window.localStorage;
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function maybeParseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function deepCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  const r = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().replace(/-/g, '')
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${r}`;
}

function num(value: unknown): number {
  return Number.parseFloat(String(value ?? 0)) || 0;
}

function toIso(value: unknown, fallback = ''): string {
  if (!value) return fallback;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
}

function sanitizeCode(code: string): string {
  return String(code || '').trim().toUpperCase();
}

function normalizeStatus(status: unknown): BomStatus {
  const raw = String(status ?? 'draft').toLowerCase();
  if (raw === 'review') return 'submitted';
  if (raw === 'submitted' || raw === 'approved' || raw === 'final' || raw === 'archived') return raw;
  return 'draft';
}

function normalizeProductType(value: unknown): ProductType {
  const raw = String(value ?? '').trim();
  return PRODUCT_TYPES.includes(raw as ProductType) ? (raw as ProductType) : 'Standard';
}

function getActor() {
  if (typeof window === 'undefined') return { id: 'ui-user', role: 'engineering' };
  const id = localStorage.getItem('bom.user.id') || localStorage.getItem('bom.user.email') || 'ui-user';
  const role = (localStorage.getItem('bom.user.role') || 'engineering').toLowerCase();
  return { id, role };
}

function normalizeMetadata(input: Partial<BomMetadata> | undefined, codeFallback = '', nameFallback = ''): BomMetadata {
  const code = sanitizeCode(String(input?.productCode ?? codeFallback ?? ''));
  const name = String(input?.productName ?? nameFallback ?? '').trim();
  const productType = normalizeProductType(input?.productType);
  return {
    productCode: code,
    productName: name,
    productDisplay: input?.productDisplay ? String(input.productDisplay) : `[${code}] ${name}`.trim(),
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

function normalizeBomRows(rows: BomRow[] | undefined): BomRow[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((item, index) => {
    const source = (item ?? {}) as Partial<BomRow>;
    const normalized = normalizeBomRow({
      ...source,
      id: source.id ? String(source.id) : uid('row'),
      no: index + 1,
    } as Partial<BomRow> & { id: string });
    return { ...recomputeRow(normalized), no: index + 1 };
  });
}

function normalizeHardwareRows(rows: HardwareRow[] | undefined): HardwareRow[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((item, index) => ({
    id: item?.id ? String(item.id) : uid('hw'),
    no: index + 1,
    partCode: String(item?.partCode ?? ''),
    description: String(item?.description ?? ''),
    material: String(item?.material ?? 'HARDWARE'),
    jenisHardware: String(item?.jenisHardware ?? 'FITTING'),
    qty: String(item?.qty ?? '1'),
    unit: item?.unit ? String(item.unit) : undefined,
    unitCost: item?.unitCost ? String(item.unitCost) : undefined,
    totalCost: item?.totalCost ? String(item.totalCost) : undefined,
    supplier: item?.supplier ? String(item.supplier) : undefined,
    keterangan: String(item?.keterangan ?? ''),
  }));
}

function normalizeOperations(rows: Operation[] | undefined): Operation[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((item, index) => ({
    id: item?.id ? String(item.id) : uid('op'),
    no: index + 1,
    name: String(item?.name ?? ''),
    manufacture: String(item?.manufacture ?? ''),
    workCenter: String(item?.workCenter ?? ''),
    routing: String(item?.routing ?? ''),
    setupMin: String(item?.setupMin ?? ''),
    runMin: String(item?.runMin ?? ''),
    costPerHour: String(item?.costPerHour ?? ''),
    totalCost: String(item?.totalCost ?? ''),
    linkedComponentIds: Array.isArray(item?.linkedComponentIds)
      ? item.linkedComponentIds.map((v) => String(v))
      : [],
    processMode: item?.processMode === 'erp' ? 'erp' : 'manual',
    salaryMode: item?.salaryMode === 'erp' ? 'erp' : 'manual',
    salaryManualRate: String(item?.salaryManualRate ?? ''),
    salaryTypeErp: String(item?.salaryTypeErp ?? ''),
    peopleCount: String(item?.peopleCount ?? ''),
    durationMin: String(item?.durationMin ?? ''),
  }));
}

function normalizePackingRows(rows: PackingRow[] | undefined): PackingRow[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((item, index) => ({
    id: item?.id ? String(item.id) : uid('pack'),
    no: index + 1,
    partCode: String(item?.partCode ?? ''),
    description: String(item?.description ?? ''),
    category:
      item?.category === 'inner' ||
      item?.category === 'outer' ||
      item?.category === 'protection' ||
      item?.category === 'label' ||
      item?.category === 'accessory'
        ? item.category
        : 'inner',
    material: String(item?.material ?? ''),
    dimP: String(item?.dimP ?? ''),
    dimL: String(item?.dimL ?? ''),
    dimT: String(item?.dimT ?? ''),
    qty: String(item?.qty ?? ''),
    unit: String(item?.unit ?? ''),
    unitCost: String(item?.unitCost ?? ''),
    totalCost: String(item?.totalCost ?? ''),
    weight: String(item?.weight ?? ''),
    keterangan: String(item?.keterangan ?? ''),
  }));
}

function costSummary(bomRows: BomRow[], hardwareRows: HardwareRow[], packingRows: PackingRow[]): BomCostSummary {
  const s = computeSummary(bomRows, hardwareRows, packingRows);
  return {
    material: Number(s.biayaSatuan || 0),
    manufacture: Number(s.mfgCost || 0),
    hardware: Number(s.hardwareCost || 0),
    packing: Number(s.packingCost || 0),
    treatment: Number(s.treatmentCost || 0),
    grandTotal: Number(s.grand || 0),
  };
}

function makeSnapshot(input: {
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
  const bomRows = normalizeBomRows(input.bomRows ?? []);
  const hardwareRows = normalizeHardwareRows(input.hardwareRows ?? []);
  const operations = normalizeOperations(input.operations ?? []);
  const packingRows = normalizePackingRows(input.packingRows ?? []);
  const packingInfo = normalizePackingInfo(input.packingInfo);
  return {
    metadata,
    bomRows,
    hardwareRows,
    operations,
    packingRows,
    packingInfo,
    costSummary: costSummary(bomRows, hardwareRows, packingRows),
  };
}

function makeVersion(input: {
  version: string;
  status?: BomStatus;
  createdBy?: string;
  notes?: string | null;
  parentVersionId?: string | null;
  id?: string;
  versionId?: string;
  createdAt?: string;
  updatedAt?: string;
  isImmutable?: boolean;
  snapshot: ReturnType<typeof makeSnapshot>;
}): BomVersionDetail {
  const status = normalizeStatus(input.status);
  const createdAt = toIso(input.createdAt, nowIso());
  const updatedAt = toIso(input.updatedAt, createdAt);
  return {
    id: input.id ? String(input.id) : uid('ver'),
    versionId: input.versionId ? String(input.versionId) : uid('vref'),
    version: String(input.version || '1.0'),
    status,
    isImmutable: Boolean(input.isImmutable) || status === 'final' || status === 'archived',
    createdAt,
    updatedAt,
    createdBy: String(input.createdBy ?? 'ui-user'),
    notes: input.notes ?? null,
    parentVersionId: input.parentVersionId ?? null,
    metadata: input.snapshot.metadata,
    bomRows: input.snapshot.bomRows,
    hardwareRows: input.snapshot.hardwareRows,
    operations: input.snapshot.operations,
    packingRows: input.snapshot.packingRows,
    packingInfo: input.snapshot.packingInfo,
    costSummary: input.snapshot.costSummary,
  };
}

function normalizeVersion(raw: any, fallbackCode: string, fallbackName: string, index: number): BomVersionDetail {
  const metadata = maybeParseJson<Partial<BomMetadata>>(raw?.metadata ?? raw?.metadataJson, {});
  const bomRows = maybeParseJson<BomRow[]>(raw?.bomRows ?? raw?.bomRowsJson, []);
  const hardwareRows = maybeParseJson<HardwareRow[]>(raw?.hardwareRows ?? raw?.hardwareRowsJson, []);
  const operations = maybeParseJson<Operation[]>(raw?.operations ?? raw?.operationsJson, []);
  const packingRows = maybeParseJson<PackingRow[]>(raw?.packingRows ?? raw?.packingRowsJson, []);
  const packingInfo = maybeParseJson<Partial<PackingInfo>>(raw?.packingInfo ?? raw?.packingInfoJson, {});

  return makeVersion({
    id: raw?.id,
    versionId: raw?.versionId,
    version: String(raw?.version ?? `${index + 1}.0`),
    status: normalizeStatus(raw?.status),
    createdBy: raw?.createdBy ? String(raw.createdBy) : undefined,
    notes: raw?.notes == null ? null : String(raw.notes),
    parentVersionId: raw?.parentVersionId == null ? null : String(raw.parentVersionId),
    createdAt: raw?.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw?.updatedAt ? String(raw.updatedAt) : undefined,
    isImmutable: Boolean(raw?.isImmutable),
    snapshot: makeSnapshot({
      code: fallbackCode,
      name: fallbackName,
      metadata,
      bomRows,
      hardwareRows,
      operations,
      packingRows,
      packingInfo,
    }),
  });
}

function normalizeDocument(raw: any, index: number): LocalDocument | null {
  if (!raw || typeof raw !== 'object') return null;
  const metadata = maybeParseJson<Partial<BomMetadata>>(raw.metadata ?? raw.metadataJson, {});
  const fallbackCode = sanitizeCode(String(raw.code ?? metadata.productCode ?? `BOM-${String(index + 1).padStart(3, '0')}`));
  const fallbackName = String(raw.name ?? metadata.productName ?? `BOM ${index + 1}`).trim();
  const versionsRaw = Array.isArray(raw.versions) && raw.versions.length > 0 ? raw.versions : [raw];
  const versions = versionsRaw.map((item: any, i: number) => normalizeVersion(item, fallbackCode, fallbackName, i));
  const currentVersionId = versions.some((v: BomVersionDetail) => v.id === raw.currentVersionId)
    ? String(raw.currentVersionId)
    : versions[versions.length - 1]?.id ?? null;
  return {
    id: raw.id ? String(raw.id) : uid('doc'),
    code: fallbackCode,
    name: fallbackName,
    description: raw.description == null ? null : String(raw.description),
    currentVersionId,
    versions,
    createdAt: toIso(raw.createdAt, versions[0]?.createdAt || nowIso()),
    updatedAt: toIso(raw.updatedAt, versions[versions.length - 1]?.updatedAt || nowIso()),
  };
}

function readDocuments(): LocalDocument[] {
  const storage = getStorage();
  let docs = parseJson<any[]>(storage.getItem(DOCS_KEY), [])
    .map((item, index) => normalizeDocument(item, index))
    .filter((item): item is LocalDocument => Boolean(item));

  if (docs.length === 0) {
    const legacy = parseJson<any>(storage.getItem(LEGACY_STATE_KEY), null);
    const normalized = normalizeDocument(legacy, 0);
    if (normalized) docs = [normalized];
  }

  const used = new Set<string>();
  docs = docs.map((doc, index) => {
    const base = sanitizeCode(doc.code || `BOM-${String(index + 1).padStart(3, '0')}`);
    let code = base;
    let suffix = 2;
    while (used.has(code)) {
      code = `${base}-${suffix}`;
      suffix += 1;
    }
    used.add(code);
    return { ...doc, code };
  });

  writeDocuments(docs);
  return docs;
}

function writeDocuments(docs: LocalDocument[]): void {
  getStorage().setItem(DOCS_KEY, JSON.stringify(docs));
}

function getCurrentVersion(doc: LocalDocument): BomVersionDetail {
  const current = doc.currentVersionId
    ? doc.versions.find((v) => v.id === doc.currentVersionId)
    : null;
  const fallback = doc.versions[doc.versions.length - 1];
  if (!current && !fallback) throw new Error('Versi BOM tidak ditemukan');
  return current || fallback;
}

function sortedVersions(doc: LocalDocument): BomVersionDetail[] {
  return [...doc.versions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function getExpiryState(expiryDate: string): ExpiryState {
  if (!expiryDate) return 'active';
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return 'active';
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  if (expiry.getTime() < now.getTime()) return 'expired';
  if (expiry.getTime() <= soon.getTime()) return 'expiringSoon';
  return 'active';
}

function getNeedsReview(version: BomVersionDetail): string[] {
  const reasons: string[] = [];
  const expiryState = getExpiryState(String(version.metadata.expiryDate ?? ''));
  const created = new Date(version.createdAt).getTime();
  const updated = new Date(version.updatedAt).getTime();
  const now = Date.now();
  if (expiryState === 'expiringSoon') reasons.push('expiring_30_days');
  if ((now - updated) / 86400000 > 180) reasons.push('not_revised_6_months');
  if (version.status === 'draft' && (now - created) / 86400000 > 14) reasons.push('draft_over_14_days');
  return reasons;
}

function toListItem(doc: LocalDocument): BomListItem {
  const version = getCurrentVersion(doc);
  const metadata = version.metadata;
  const expiryDate = String(metadata.expiryDate ?? '');
  return {
    id: doc.id,
    code: doc.code,
    name: doc.name,
    description: doc.description,
    currentVersionId: doc.currentVersionId,
    version: version.version,
    versionId: version.versionId,
    status: version.status,
    productType: normalizeProductType(metadata.productType),
    leadTime: String(metadata.leadTime ?? ''),
    effectiveDate: String(metadata.effectiveDate ?? ''),
    expiryDate,
    expiryState: getExpiryState(expiryDate),
    needsReview: getNeedsReview(version),
    customer: String(metadata.customer ?? ''),
    itemType: String(metadata.itemType ?? ''),
    bomType: String(metadata.bomType ?? 'manufacture'),
    variant: String(metadata.productVariant ?? 'Standard'),
    qty: String(metadata.bomQuantity ?? '1'),
    dimensions: `${metadata.itemWidth || '-'} x ${metadata.itemDepth || '-'} x ${metadata.itemHeight || '-'}`,
    volM3: String(metadata.volM3 ?? ''),
    modulCount: version.bomRows.filter((row) => row.levelNum === 0).length,
    subModulCount: version.bomRows.filter((row) => row.levelNum === 1).length,
    partCount: version.bomRows.filter((row) => row.levelNum === 2).length,
    hardwareCount: version.hardwareRows.length,
    costSummary: version.costSummary,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toDocumentDetail(doc: LocalDocument): BomDocumentDetail {
  const version = getCurrentVersion(doc);
  const metadata = version.metadata;
  const expiryDate = String(metadata.expiryDate ?? '');
  return {
    id: doc.id,
    code: doc.code,
    name: doc.name,
    description: doc.description,
    currentVersionId: doc.currentVersionId,
    productType: normalizeProductType(metadata.productType),
    leadTime: String(metadata.leadTime ?? ''),
    effectiveDate: String(metadata.effectiveDate ?? ''),
    expiryDate,
    expiryState: getExpiryState(expiryDate),
    needsReview: getNeedsReview(version),
    costSummary: version.costSummary,
    versions: deepCopy(sortedVersions(doc)),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
function ensureUniqueCode(docs: LocalDocument[], code: string, exceptId?: string): void {
  const normalized = sanitizeCode(code);
  const exists = docs.some((doc) => sanitizeCode(doc.code) === normalized && doc.id !== exceptId);
  if (exists) throw new Error(`BOM code ${normalized} already exists`);
}

function nextVersion(current: string): string {
  const [majorRaw, minorRaw] = String(current || '1.0').split('.');
  const major = Number.parseInt(majorRaw || '1', 10) || 1;
  const minor = (Number.parseInt(minorRaw || '0', 10) || 0) + 1;
  return `${major}.${minor}`;
}

function normalizeFormat(format: string): 'pdf' | 'excel' | 'both' {
  const value = String(format || '').toLowerCase();
  if (value === 'pdf' || value === 'excel' || value === 'both') return value;
  throw new Error('Format export tidak valid');
}

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return window.btoa(binary);
}

function buildCsv(version: BomVersionDetail, doc: LocalDocument): string {
  const header = ['No', 'Part Code', 'Description', 'Qty', 'Scrap%', 'Qty Actual', 'Material Cost', 'Manufacture Cost'];
  const rows = version.bomRows.map((row) => {
    const qty = num(row.qty);
    const scrap = num(row.scrapPercent);
    const qtyActual = num(row.qtyActual || qty * (1 + scrap / 100));
    const materialCost = num(row.biayaSatuan) * qtyActual;
    const manufacture = num(row.totalManufactureCost) > 0 ? num(row.totalManufactureCost) : num(row.workCenterCost) + num(row.routingCost);
    return [
      row.no,
      row.partCode,
      row.description || row.modul,
      qty.toFixed(2),
      scrap.toFixed(2),
      qtyActual.toFixed(2),
      materialCost.toFixed(2),
      manufacture.toFixed(2),
    ];
  });

  return [
    `BOM Code,${doc.code}`,
    `BOM Name,${doc.name}`,
    `Version,${version.version}`,
    `Status,${version.status.toUpperCase()}`,
    '',
    header.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
}

function buildPdfText(version: BomVersionDetail, doc: LocalDocument): string {
  const lines = [
    'BOM EXPORT',
    `WATERMARK: ${version.status.toUpperCase()}`,
    `BOM: ${doc.code} - ${doc.name}`,
    `VERSION: ${version.version}`,
    `PRODUCT TYPE: ${version.metadata.productType || 'Standard'}`,
    `LEAD TIME: ${version.metadata.leadTime || '-'}`,
    `EFFECTIVE DATE: ${version.metadata.effectiveDate || '-'}`,
    `EXPIRY DATE: ${version.metadata.expiryDate || '-'}`,
    '',
    `MATERIAL: ${version.costSummary.material.toFixed(2)}`,
    `MANUFACTURE: ${version.costSummary.manufacture.toFixed(2)}`,
    `HARDWARE: ${version.costSummary.hardware.toFixed(2)}`,
    `PACKING: ${version.costSummary.packing.toFixed(2)}`,
    `GRAND TOTAL: ${version.costSummary.grandTotal.toFixed(2)}`,
  ];
  return lines.join('\n');
}

class BomApiClient {
  private findDocOrThrow(docs: LocalDocument[], id: string): { doc: LocalDocument; index: number } {
    const index = docs.findIndex((doc) => doc.id === id);
    if (index < 0) throw new Error('BOM Document not found');
    return { doc: docs[index], index };
  }

  async listBom(filters: BomFilters = {}): Promise<BomListItem[]> {
    let items = readDocuments().map(toListItem);
    if (filters.q) {
      const q = filters.q.trim().toLowerCase();
      items = items.filter((item) =>
        [item.code, item.name, item.customer, item.itemType, item.variant].join(' ').toLowerCase().includes(q),
      );
    }
    if (filters.status) items = items.filter((item) => item.status === filters.status);
    if (filters.productType) items = items.filter((item) => item.productType === filters.productType);
    if (filters.expiryState) items = items.filter((item) => item.expiryState === filters.expiryState);
    if (typeof filters.needsReview === 'boolean') {
      items = items.filter((item) => (item.needsReview.length > 0) === filters.needsReview);
    }
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async createBom(payload: CreateBomPayload): Promise<BomDocumentDetail> {
    const docs = readDocuments();
    const inputCode = sanitizeCode(String(payload.code || payload.metadata?.productCode || ''));
    const inputName = String(payload.name || payload.metadata?.productName || '').trim();
    if (!inputCode) throw new Error('code is required');
    if (!inputName) throw new Error('name is required');
    ensureUniqueCode(docs, inputCode);

    const snapshot = makeSnapshot({
      code: inputCode,
      name: inputName,
      metadata: payload.metadata,
      bomRows: payload.bomRows,
      hardwareRows: payload.hardwareRows,
      operations: payload.operations,
      packingRows: payload.packingRows,
      packingInfo: payload.packingInfo,
    });

    const finalCode = sanitizeCode(snapshot.metadata.productCode || inputCode);
    const finalName = String(snapshot.metadata.productName || inputName).trim() || inputName;
    ensureUniqueCode(docs, finalCode);

    const actor = getActor();
    const version = makeVersion({
      version: '1.0',
      status: 'draft',
      createdBy: actor.id,
      snapshot,
    });

    const now = nowIso();
    const doc: LocalDocument = {
      id: uid('doc'),
      code: finalCode,
      name: finalName,
      description: payload.description ? String(payload.description) : null,
      currentVersionId: version.id,
      versions: [version],
      createdAt: now,
      updatedAt: now,
    };

    docs.push(doc);
    writeDocuments(docs);
    return toDocumentDetail(doc);
  }

  async getBom(id: string): Promise<BomDocumentDetail> {
    const docs = readDocuments();
    const { doc } = this.findDocOrThrow(docs, id);
    return toDocumentDetail(doc);
  }

  async updateBom(id: string, payload: UpdateBomPayload): Promise<BomVersionDetail> {
    const docs = readDocuments();
    const { doc, index } = this.findDocOrThrow(docs, id);
    const current = getCurrentVersion(doc);
    if (current.isImmutable || current.status === 'final' || current.status === 'archived') {
      throw new Error('Versi ini immutable/read-only');
    }

    const snapshot = makeSnapshot({
      code: doc.code,
      name: doc.name,
      metadata: { ...current.metadata, ...(payload.metadata || {}) },
      bomRows: payload.bomRows ?? current.bomRows,
      hardwareRows: payload.hardwareRows ?? current.hardwareRows,
      operations: payload.operations ?? current.operations,
      packingRows: payload.packingRows ?? current.packingRows,
      packingInfo: payload.packingInfo
        ? { ...current.packingInfo, ...payload.packingInfo }
        : current.packingInfo,
    });

    const nextCode = sanitizeCode(snapshot.metadata.productCode || doc.code);
    const nextName = String(snapshot.metadata.productName || doc.name).trim() || doc.name;
    ensureUniqueCode(docs, nextCode, doc.id);

    const updated: BomVersionDetail = {
      ...current,
      metadata: snapshot.metadata,
      bomRows: snapshot.bomRows,
      hardwareRows: snapshot.hardwareRows,
      operations: snapshot.operations,
      packingRows: snapshot.packingRows,
      packingInfo: snapshot.packingInfo,
      costSummary: snapshot.costSummary,
      notes: payload.notes ?? current.notes ?? null,
      updatedAt: nowIso(),
    };

    doc.code = nextCode;
    doc.name = nextName;
    doc.currentVersionId = updated.id;
    doc.versions = doc.versions.map((v) => (v.id === updated.id ? updated : v));
    doc.updatedAt = nowIso();
    docs[index] = doc;
    writeDocuments(docs);
    return deepCopy(updated);
  }

  async deleteBom(id: string, _options?: { force?: boolean }): Promise<{ deleted: boolean }> {
    const docs = readDocuments();
    const { index } = this.findDocOrThrow(docs, id);
    docs.splice(index, 1);
    writeDocuments(docs);
    return { deleted: true };
  }

  async getVersions(
    id: string,
  ): Promise<
    Array<
      Omit<
        BomVersionDetail,
        'metadata' | 'bomRows' | 'hardwareRows' | 'operations' | 'packingRows' | 'packingInfo' | 'costSummary'
      >
    >
  > {
    const docs = readDocuments();
    const { doc } = this.findDocOrThrow(docs, id);
    return sortedVersions(doc).map((v) => ({
      id: v.id,
      versionId: v.versionId,
      version: v.version,
      status: v.status,
      isImmutable: v.isImmutable,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      createdBy: v.createdBy,
      notes: v.notes,
      parentVersionId: v.parentVersionId,
    }));
  }

  async createVersion(id: string, payload: CreateVersionPayload): Promise<BomVersionDetail> {
    const docs = readDocuments();
    const { doc, index } = this.findDocOrThrow(docs, id);
    const current = getCurrentVersion(doc);

    const snapshot = makeSnapshot({
      code: doc.code,
      name: doc.name,
      metadata: payload.metadata ? { ...current.metadata, ...payload.metadata } : current.metadata,
      bomRows: payload.bomRows ?? current.bomRows,
      hardwareRows: payload.hardwareRows ?? current.hardwareRows,
      operations: payload.operations ?? current.operations,
      packingRows: payload.packingRows ?? current.packingRows,
      packingInfo: payload.packingInfo
        ? { ...current.packingInfo, ...payload.packingInfo }
        : current.packingInfo,
    });

    const nextCode = sanitizeCode(snapshot.metadata.productCode || doc.code);
    const nextName = String(snapshot.metadata.productName || doc.name).trim() || doc.name;
    ensureUniqueCode(docs, nextCode, doc.id);

    const actor = getActor();
    const created = makeVersion({
      version: payload.version?.trim() || nextVersion(current.version),
      status: payload.status || 'draft',
      createdBy: actor.id,
      notes: payload.notes ?? null,
      parentVersionId: current.versionId,
      snapshot,
    });

    doc.code = nextCode;
    doc.name = nextName;
    doc.currentVersionId = created.id;
    doc.versions = [...doc.versions, created];
    doc.updatedAt = nowIso();
    docs[index] = doc;
    writeDocuments(docs);
    return deepCopy(created);
  }

  async submitReview(id: string, comment?: string): Promise<BomVersionDetail> {
    const _comment = comment;
    const docs = readDocuments();
    const { doc, index } = this.findDocOrThrow(docs, id);
    const current = getCurrentVersion(doc);
    if (current.status !== 'draft') throw new Error('Only draft version can be submitted for review');
    const updated = { ...current, status: 'submitted' as BomStatus, updatedAt: nowIso() };
    doc.versions = doc.versions.map((v) => (v.id === updated.id ? updated : v));
    doc.updatedAt = nowIso();
    docs[index] = doc;
    writeDocuments(docs);
    return deepCopy(updated);
  }

  async approve(id: string, comment?: string): Promise<BomVersionDetail> {
    const _comment = comment;
    const actor = getActor();
    if (!APPROVER_ROLES.has(actor.role)) throw new Error('Forbidden: only owner or supervisor can perform this action');
    const docs = readDocuments();
    const { doc, index } = this.findDocOrThrow(docs, id);
    const current = getCurrentVersion(doc);
    if (current.status !== 'submitted') throw new Error('Only submitted version can be approved');
    const updated = { ...current, status: 'approved' as BomStatus, updatedAt: nowIso() };
    doc.versions = doc.versions.map((v) => (v.id === updated.id ? updated : v));
    doc.updatedAt = nowIso();
    docs[index] = doc;
    writeDocuments(docs);
    return deepCopy(updated);
  }

  async reject(id: string, comment: string): Promise<BomVersionDetail> {
    const actor = getActor();
    if (!APPROVER_ROLES.has(actor.role)) throw new Error('Forbidden: only owner or supervisor can perform this action');
    if (!comment || !comment.trim()) throw new Error('Reject comment is required');
    const docs = readDocuments();
    const { doc, index } = this.findDocOrThrow(docs, id);
    const current = getCurrentVersion(doc);
    if (current.status !== 'submitted') throw new Error('Only submitted version can be rejected');
    const updated = { ...current, status: 'draft' as BomStatus, updatedAt: nowIso() };
    doc.versions = doc.versions.map((v) => (v.id === updated.id ? updated : v));
    doc.updatedAt = nowIso();
    docs[index] = doc;
    writeDocuments(docs);
    return deepCopy(updated);
  }

  async finalize(id: string, comment?: string): Promise<BomVersionDetail> {
    const _comment = comment;
    const actor = getActor();
    if (!APPROVER_ROLES.has(actor.role)) throw new Error('Forbidden: only owner or supervisor can perform this action');
    const docs = readDocuments();
    const { doc, index } = this.findDocOrThrow(docs, id);
    const current = getCurrentVersion(doc);
    if (current.status !== 'approved') throw new Error('Only approved version can be finalized');
    const updated = { ...current, status: 'final' as BomStatus, isImmutable: true, updatedAt: nowIso() };
    doc.versions = doc.versions.map((v) => (v.id === updated.id ? updated : v));
    doc.updatedAt = nowIso();
    docs[index] = doc;
    writeDocuments(docs);
    return deepCopy(updated);
  }

  async exportBom(id: string, formatInput: 'pdf' | 'excel' | 'both'): Promise<ExportResponse> {
    const docs = readDocuments();
    const { doc } = this.findDocOrThrow(docs, id);
    const current = getCurrentVersion(doc);
    if (current.status !== 'final') throw new Error('Export is only allowed for final BOM');

    const format = normalizeFormat(formatInput);
    const d = new Date();
    const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const baseName = `${doc.code}_${current.version}_${date}`;
    const files: ExportResponse['files'] = [];

    if (format === 'pdf' || format === 'both') {
      files.push({
        name: `${baseName}.pdf.txt`,
        mimeType: 'text/plain',
        contentBase64: encodeBase64(buildPdfText(current, doc)),
      });
    }
    if (format === 'excel' || format === 'both') {
      files.push({
        name: `${baseName}.csv`,
        mimeType: 'text/csv',
        contentBase64: encodeBase64(buildCsv(current, doc)),
      });
    }

    return {
      format,
      watermark: current.status.toUpperCase(),
      generatedAt: nowIso(),
      filenamePattern: baseName,
      files,
    };
  }

  async getUsedInWo(id: string): Promise<WorkOrderUsageResponse> {
    const docs = readDocuments();
    const { doc } = this.findDocOrThrow(docs, id);
    return {
      bomId: doc.id,
      bomCode: doc.code,
      bomName: doc.name,
      count: 0,
      items: [],
      source: 'fallback',
    };
  }

  async getStockStatus(id: string): Promise<StockStatusResponse> {
    const docs = readDocuments();
    const { doc } = this.findDocOrThrow(docs, id);
    const version = getCurrentVersion(doc);

    const components = version.bomRows
      .filter((row) => row.levelNum >= 2 && String(row.partCode || '').trim())
      .map((row) => {
        const qtyRequired = num(row.qtyActual || row.qty);
        const qtyAvailable = qtyRequired > 0 ? Number((qtyRequired * 1.5).toFixed(2)) : 0;
        const stockStatus: 'available' | 'low' | 'out' =
          qtyAvailable <= 0 ? 'out' : qtyAvailable < qtyRequired ? 'low' : 'available';
        return {
          partCode: String(row.partCode || ''),
          qtyRequired,
          qtyAvailable,
          stockStatus,
          warehouses: [
            {
              warehouseId: 'WH-01',
              warehouseName: 'Gudang Utama',
              qtyAvailable,
            },
          ],
        };
      });

    const qtyRequired = components.reduce((sum, item) => sum + item.qtyRequired, 0);
    const qtyAvailable = components.reduce((sum, item) => sum + item.qtyAvailable, 0);
    const stockStatus: 'available' | 'low' | 'out' =
      components.some((item) => item.stockStatus === 'out')
        ? 'out'
        : components.some((item) => item.stockStatus === 'low')
          ? 'low'
          : 'available';

    return {
      bomId: doc.id,
      bomCode: doc.code,
      qtyRequired,
      qtyAvailable,
      stockStatus,
      components,
      source: 'fallback',
    };
  }

  async getHistory(_id: string): Promise<AuditHistoryResponse> {
    return {
      auditLogs: [],
      approvals: [],
    };
  }

  async migrateLocalData(_payload: { docs?: unknown[]; legacyState?: unknown }): Promise<{ imported: number; skipped: number; total: number; errors: string[] }> {
    return {
      imported: 0,
      skipped: 0,
      total: 0,
      errors: [],
    };
  }
}

export const bomApiClient = new BomApiClient();
