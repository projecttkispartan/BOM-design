import type { BomRow, BomMetadata, HardwareRow, Operation, PackingRow, PackingInfo } from '@/types';
import { defaultMetadata, defaultBomRows, defaultHardwareRows, defaultOperations, defaultPackingInfo, generateRowId } from './initialState';
import { normalizeBomRow } from './normalizeBomRow';
import { recomputeRow, computeSummary } from './calculations';

export type BomStatus = 'draft' | 'submitted' | 'approved' | 'final' | 'archived' | 'review';

export function normalizeBomStatus(status: string | undefined | null): BomStatus {
  if (!status) return 'draft';
  if (status === 'review') return 'submitted';
  if (status === 'submitted' || status === 'approved' || status === 'final' || status === 'archived' || status === 'draft') {
    return status;
  }
  return 'draft';
}

export interface BomVersion {
  versionId: string;
  version: string;
  status: BomStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  notes: string;
  parentVersionId: string | null;
  metadata: BomMetadata;
  bomRows: BomRow[];
  hardwareRows: HardwareRow[];
  operations: Operation[];
  packingRows: PackingRow[];
  packingInfo: PackingInfo;
}

export interface BomDocument {
  id: string;
  code: string;
  name: string;
  currentVersionId: string;
  versions: BomVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface BomDocumentSummary {
  id: string;
  code: string;
  name: string;
  customer: string;
  itemType: string;
  wood: string;
  bomType: string;
  variant: string;
  qty: string;
  totalCost: number;
  materialCost: number;
  mfgCost: number;
  edgingCost: number;
  finishingCost: number;
  status: BomStatus;
  version: string;
  versionCount: number;
  createdAt: string;
  updatedAt: string;
  usedInWoCount?: number;
  expiryState?: 'active' | 'expired' | 'expiringSoon';
  needsReview?: string[];
  modulCount: number;
  subModulCount: number;
  partCount: number;
  hardwareCount: number;
  dimensions: string;
  volM3: string;
  coatingColor: string;
}

const DOCS_KEY = 'bom-app-documents';

function genId(): string {
  return 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function genVersionId(): string {
  return 'ver_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

export function loadDocuments(): BomDocument[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(DOCS_KEY);
    if (raw) return JSON.parse(raw) as BomDocument[];
  } catch (_) {}
  return [];
}

export function saveDocuments(docs: BomDocument[]): boolean {
  try {
    if (typeof window === 'undefined') return false;
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
    return true;
  } catch (_) {
    return false;
  }
}

function migrateFromLegacy(): BomDocument | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('bom-app-state');
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.bomRows || !data.metadata) return null;

    const meta = data.metadata as BomMetadata;
    const rows = (data.bomRows as BomRow[]).map((r) => recomputeRow(normalizeBomRow(r)));
    const hw = (data.hardwareRows ?? []) as HardwareRow[];
    const ops = (data.operations ?? []) as Operation[];

    const now = new Date().toISOString();
    const vId = genVersionId();
    const dId = genId();

    const version: BomVersion = {
      versionId: vId,
      version: '1.0',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      createdBy: 'System',
      notes: 'Migrasi dari data lama',
      parentVersionId: null,
      metadata: meta,
      bomRows: rows,
      hardwareRows: hw,
      operations: ops,
      packingRows: (data.packingRows ?? []) as PackingRow[],
      packingInfo: data.packingInfo ? { ...defaultPackingInfo, ...data.packingInfo } : { ...defaultPackingInfo },
    };

    return {
      id: dId,
      code: meta.productCode || 'BOM-001',
      name: meta.productName || 'Untitled BOM',
      currentVersionId: vId,
      versions: [version],
      createdAt: now,
      updatedAt: now,
    };
  } catch (_) {
    return null;
  }
}

export function initDocuments(): BomDocument[] {
  let docs = loadDocuments();
  if (docs.length === 0) {
    const legacy = migrateFromLegacy();
    if (legacy) {
      docs = [legacy];
    } else {
      docs = [createDefaultDocument()];
    }
    saveDocuments(docs);
  }
  return docs;
}

export function createDefaultDocument(): BomDocument {
  const now = new Date().toISOString();
  const vId = genVersionId();
  const dId = genId();

  const version: BomVersion = {
    versionId: vId,
    version: '1.0',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    createdBy: 'Admin',
    notes: 'Versi awal',
    parentVersionId: null,
    metadata: { ...defaultMetadata },
    bomRows: defaultBomRows.map((r) => ({ ...r })),
    hardwareRows: defaultHardwareRows.map((r) => ({ ...r })),
    operations: defaultOperations.map((r) => ({ ...r })),
    packingRows: [],
    packingInfo: { ...defaultPackingInfo },
  };

  return {
    id: dId,
    code: defaultMetadata.productCode,
    name: defaultMetadata.productName,
    currentVersionId: vId,
    versions: [version],
    createdAt: now,
    updatedAt: now,
  };
}

export function createBlankDocument(name: string, code: string): BomDocument {
  const now = new Date().toISOString();
  const vId = genVersionId();
  const dId = genId();

  const meta: BomMetadata = {
    ...defaultMetadata,
    productCode: code,
    productName: name,
    productDisplay: `[${code}] ${name}`,
    reference: '',
    productVariant: 'Standard',
    customer: '',
    buyerCode: '',
    itemType: '',
    wood: '',
    coatingColor: '',
    itemWidth: '',
    itemDepth: '',
    itemHeight: '',
    volM3: '',
  };

  const version: BomVersion = {
    versionId: vId,
    version: '1.0',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    createdBy: 'Admin',
    notes: 'Versi awal',
    parentVersionId: null,
    metadata: meta,
    bomRows: [],
    hardwareRows: [],
    operations: [],
    packingRows: [],
    packingInfo: { ...defaultPackingInfo },
  };

  return {
    id: dId,
    code,
    name,
    currentVersionId: vId,
    versions: [version],
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateDocument(doc: BomDocument): BomDocument {
  const now = new Date().toISOString();
  const vId = genVersionId();
  const dId = genId();
  const currentVer = doc.versions.find((v) => v.versionId === doc.currentVersionId) ?? doc.versions[doc.versions.length - 1];

  const idMap: Record<string, string> = {};
  const newRows = currentVer.bomRows.map((r) => {
    const newId = generateRowId();
    idMap[r.id] = newId;
    return { ...r, id: newId };
  });
  newRows.forEach((r) => {
    if (r.parentId && idMap[r.parentId]) r.parentId = idMap[r.parentId];
  });

  const newMeta = { ...currentVer.metadata, productDisplay: `[${doc.code}-COPY] ${doc.name} (Copy)` };

  const version: BomVersion = {
    versionId: vId,
    version: '1.0',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    createdBy: 'Admin',
    notes: `Duplikasi dari ${doc.name} v${currentVer.version}`,
    parentVersionId: null,
    metadata: newMeta,
    bomRows: newRows,
    hardwareRows: currentVer.hardwareRows.map((r) => ({ ...r, id: 'h' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) })),
    operations: currentVer.operations.map((r) => ({ ...r, id: 'op' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) })),
    packingRows: (currentVer.packingRows ?? []).map((r) => ({ ...r, id: 'pk' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) })),
    packingInfo: currentVer.packingInfo ? { ...currentVer.packingInfo } : { ...defaultPackingInfo },
  };

  return {
    id: dId,
    code: doc.code + '-COPY',
    name: doc.name + ' (Copy)',
    currentVersionId: vId,
    versions: [version],
    createdAt: now,
    updatedAt: now,
  };
}

export function createNewVersion(doc: BomDocument): BomVersion {
  const now = new Date().toISOString();
  const currentVer = doc.versions.find((v) => v.versionId === doc.currentVersionId) ?? doc.versions[doc.versions.length - 1];

  const parts = currentVer.version.split('.');
  const major = parseInt(parts[0], 10) || 1;
  const minor = (parseInt(parts[1], 10) || 0) + 1;
  const newVersionStr = `${major}.${minor}`;

  return {
    versionId: genVersionId(),
    version: newVersionStr,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    createdBy: 'Admin',
    notes: '',
    parentVersionId: currentVer.versionId,
    metadata: { ...currentVer.metadata },
    bomRows: currentVer.bomRows.map((r) => ({ ...r })),
    hardwareRows: currentVer.hardwareRows.map((r) => ({ ...r })),
    operations: currentVer.operations.map((r) => ({ ...r })),
    packingRows: (currentVer.packingRows ?? []).map((r) => ({ ...r })),
    packingInfo: currentVer.packingInfo ? { ...currentVer.packingInfo } : { ...defaultPackingInfo },
  };
}

export function getDocumentSummary(doc: BomDocument): BomDocumentSummary {
  const ver = doc.versions.find((v) => v.versionId === doc.currentVersionId) ?? doc.versions[doc.versions.length - 1];
  const meta = ver.metadata;
  const summary = computeSummary(ver.bomRows, ver.hardwareRows, ver.packingRows);

  const expiryDate = meta.expiryDate ? new Date(meta.expiryDate) : null;
  const now = new Date();
  const soonThreshold = new Date();
  soonThreshold.setDate(soonThreshold.getDate() + 30);
  const expiryState: 'active' | 'expired' | 'expiringSoon' =
    expiryDate && expiryDate < now ? 'expired' : expiryDate && expiryDate <= soonThreshold ? 'expiringSoon' : 'active';

  const reasons: string[] = [];
  if (expiryState === 'expiringSoon') reasons.push('expiring_30_days');
  const updatedAt = new Date(ver.updatedAt);
  const lastRevisionDays = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
  if (lastRevisionDays > 180) reasons.push('not_revised_6_months');
  const createdAt = new Date(ver.createdAt);
  const draftAgeDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (normalizeBomStatus(ver.status) === 'draft' && draftAgeDays > 14) reasons.push('draft_over_14_days');

  return {
    id: doc.id,
    code: doc.code,
    name: doc.name,
    customer: meta.customer || '',
    itemType: meta.itemType || '',
    wood: meta.wood || '',
    bomType: meta.bomType || 'manufacture',
    variant: meta.productVariant || 'Standard',
    qty: meta.bomQuantity || '1',
    totalCost: summary.grand,
    materialCost: summary.biayaSatuan,
    mfgCost: summary.mfgCost,
    edgingCost: summary.edgingCost,
    finishingCost: summary.finishingCost,
    status: normalizeBomStatus(ver.status),
    version: ver.version,
    versionCount: doc.versions.length,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    usedInWoCount: 0,
    expiryState,
    needsReview: reasons,
    modulCount: ver.bomRows.filter((r) => r.levelNum === 0).length,
    subModulCount: ver.bomRows.filter((r) => r.levelNum === 1).length,
    partCount: ver.bomRows.filter((r) => r.levelNum === 2).length,
    hardwareCount: ver.hardwareRows.length,
    dimensions: `${meta.itemWidth || '—'} × ${meta.itemDepth || '—'} × ${meta.itemHeight || '—'}`,
    volM3: meta.volM3 || '',
    coatingColor: meta.coatingColor || '',
  };
}

export function getNextBomCode(docs: BomDocument[]): string {
  const maxNum = docs.reduce((max, d) => {
    const match = d.code.match(/^BOM-(\d+)$/);
    if (match) return Math.max(max, parseInt(match[1], 10));
    return max;
  }, 0);
  return `BOM-${String(maxNum + 1).padStart(3, '0')}`;
}
