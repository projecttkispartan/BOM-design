import type { BomRow, BomMetadata, HardwareRow, Operation, PackingInfo } from '@/types';
import { normalizeBomRow } from './normalizeBomRow';
import { recomputeRow } from './calculations';

export const defaultMetadata: BomMetadata = {
  productCode: '1227310',
  productName: 'MINDI - 30 UP',
  productDisplay: '[1227310] MINDI - 30 UP',
  reference: '',
  productVariant: 'Standard',
  bomType: 'manufacture',
  productType: 'Standard',
  bomInputMode: 'auto',
  currency: 'IDR',
  barangProduksi: '1 Set',
  proses: '',
  versiBom: '1',
  bomQuantity: '1',
  bomUnit: 'EA',
  markupPercent: '16.67',
  usdRate: '16000',
  leadTime: '',
  effectiveDate: '',
  expiryDate: '',
  customer: '',
  buyerCode: '',
  company: 'Demo Company',
  itemType: 'TABLE',
  wood: 'MINDI - 30 UP',
  coatingColor: 'NATURAL LIMED HARKA',
  itemDim: '',
  itemWidth: '',
  itemDepth: '',
  itemHeight: '',
  volM3: '',
};

function blankBomRow(overrides: Partial<BomRow> = {}): BomRow {
  return recomputeRow(
    normalizeBomRow({
      id: '',
      level: 'part',
      levelNum: 2,
      parentId: null,
      expanded: true,
      no: 0,
      mod: '',
      subMod: '',
      partCode: '',
      modul: '',
      description: '',
      unit: 'EA',
      material: '',
      kodeMat: '',
      jenis: '',
      grade: '',
      workCenterOrRouting: '',
      workCenterSetupMin: '',
      workCenterRunMin: '',
      routingSetupMin: '',
      routingRunMin: '',
      assembling: '',
      assemblingTimeMin: '',
      glueArea: '',
      glueAreaTimeMin: '',
      surface: '',
      surfaceCost: '',
      edging: '',
      edgingTimeMin: '',
      edgingCost: '',
      sisiEdging: '',
      finishing: '',
      finishingTimeMin: '',
      finishingCost: '',
      sisiVeneer: '',
      treatment: '',
      treatmentCost: '',
      imageUrl: '',
      routingName: '',
      workCenterCost: '',
      routingCost: '',
      manufactureCost: '',
      keterangan: '',
      pusatBiaya: '',
      biayaSatuan: '',
      biayaMesin: '',
      biayaTenagaKerja: '',
      unitCostTimeMin: '',
      machineCostTimeMin: '',
      laborCostTimeMin: '',
      leadTime: '',
      supplier: '',
      revision: '',
      drawingRef: '',
      wbs: '',
      dimAP: '',
      dimAL: '',
      dimAT: '',
      dimBP: '', dimBL: '', dimBT: '',
      dimCP: '', dimCL: '', dimCT: '',
      dimDP: '', dimDL: '', dimDT: '',
      volCut: '',
      volInvoice: '',
      m2: '',
      qty: '',
      routingSteps: [],
      ...overrides,
    } as BomRow),
  );
}

export const defaultBomRows: BomRow[] = [
  blankBomRow({
    id: 'r1', level: 'module', levelNum: 0, parentId: null, no: 1, mod: '1',
    modul: 'MINDI - 30 UP', description: 'MINDI - 30 UP', unit: 'EA', partCode: '1227310',
    keterangan: 'Sample data dari sheet WOOD/PLYWOOD',
  }),
  blankBomRow({
    id: 'r2', level: 'submodule', levelNum: 1, parentId: 'r1', no: 2, mod: '1.1', subMod: '1.1',
    modul: 'MINDI - 30 UP', description: 'SANDARAN', unit: 'SET', partCode: 'SANDARAN',
  }),
  blankBomRow({
    id: 'r3', level: 'submodule', levelNum: 1, parentId: 'r1', no: 3, mod: '1.2', subMod: '1.2',
    modul: 'MINDI - 30 UP', description: 'DUDUKAN', unit: 'SET', partCode: 'DUDUKAN',
  }),
  blankBomRow({
    id: 'r4', level: 'submodule', levelNum: 1, parentId: 'r1', no: 4, mod: '1.3', subMod: '1.3',
    modul: 'MINDI - 30 UP', description: 'KAKI', unit: 'SET', partCode: 'KAKI',
  }),
  blankBomRow({
    id: 'r5', level: 'part', levelNum: 2, parentId: 'r2', no: 5, mod: '1.1.1', subMod: '1.1.1',
    partCode: '1227310-1.3.0.20.1', modul: 'SANDARAN', description: 'SUNDUK SANDARAN BELAKANG', unit: 'EA',
    material: 'MINDI - 30 UP', supplier: 'VILLAGE - KP', qty: '2',
    dimAP: '492', dimAL: '40', dimAT: '40',
    workCenterOrRouting: 'LATHE', workCenterRunMin: '0.98',
    biayaSatuan: '7859', scrapPercent: '0',
  }),
  blankBomRow({
    id: 'r6', level: 'part', levelNum: 2, parentId: 'r3', no: 6, mod: '1.2.1', subMod: '1.2.1',
    partCode: '1227310-1.3.0.18.3', modul: 'DUDUKAN', description: 'SUNDUK DEPAN', unit: 'EA',
    material: 'MINDI - 30 UP', supplier: 'VILLAGE - KP', qty: '1',
    dimAP: '426', dimAL: '62', dimAT: '25',
    workCenterOrRouting: 'FLAT', workCenterRunMin: '0.0007',
    biayaSatuan: '6592', scrapPercent: '0',
  }),
  blankBomRow({
    id: 'r7', level: 'part', levelNum: 2, parentId: 'r3', no: 7, mod: '1.2.2', subMod: '1.2.2',
    partCode: '1227310-1.3.0.18.4', modul: 'DUDUKAN', description: 'SUNDUK TENGAH', unit: 'EA',
    material: 'MINDI - 30 UP', supplier: 'VILLAGE - KP', qty: '1',
    dimAP: '374', dimAL: '60', dimAT: '25',
    workCenterOrRouting: 'FLAT', workCenterRunMin: '0.0006',
    biayaSatuan: '5601', scrapPercent: '0',
  }),
  blankBomRow({
    id: 'r8', level: 'part', levelNum: 2, parentId: 'r3', no: 8, mod: '1.2.3', subMod: '1.2.3',
    partCode: '1227310-1.3.0.18.5', modul: 'DUDUKAN', description: 'SUNDUK BELAKANG', unit: 'EA',
    material: 'MINDI - 30 UP', supplier: 'VILLAGE - KP', qty: '1',
    dimAP: '395', dimAL: '25', dimAT: '25',
    workCenterOrRouting: 'LATHE', workCenterRunMin: '0.40',
    biayaSatuan: '2465', scrapPercent: '0',
  }),
  blankBomRow({
    id: 'r9', level: 'part', levelNum: 2, parentId: 'r3', no: 9, mod: '1.2.4', subMod: '1.2.4',
    partCode: '1227310-1.3.0.18.6', modul: 'DUDUKAN', description: 'SUNDUK SAMPING', unit: 'EA',
    material: 'MINDI - 30 UP', supplier: 'VILLAGE - KP', qty: '2',
    dimAP: '600', dimAL: '70', dimAT: '25',
    workCenterOrRouting: 'FLAT', workCenterRunMin: '0.0021',
    biayaSatuan: '10483', scrapPercent: '0',
  }),
  blankBomRow({
    id: 'r10', level: 'part', levelNum: 2, parentId: 'r3', no: 10, mod: '1.2.5', subMod: '1.2.5',
    partCode: '1227310-1.3.0.18.7', modul: 'DUDUKAN', description: 'SIKU DEPAN', unit: 'EA',
    material: 'MINDI - 30 UP', supplier: 'VILLAGE - KP', qty: '2',
    dimAP: '100', dimAL: '57', dimAT: '25',
    workCenterOrRouting: 'FLAT', workCenterRunMin: '0.0003',
    biayaSatuan: '1423', scrapPercent: '0',
  }),
  blankBomRow({
    id: 'r11', level: 'part', levelNum: 2, parentId: 'r3', no: 11, mod: '1.2.6', subMod: '1.2.6',
    partCode: '1227310-1.3.0.18.8', modul: 'DUDUKAN', description: 'SUPPORT DUDUKAN DEPAN', unit: 'EA',
    material: 'MINDI - 30 UP', supplier: 'VILLAGE - KP', qty: '1',
    dimAP: '100', dimAL: '20', dimAT: '20',
    workCenterOrRouting: 'FLAT', workCenterRunMin: '0.0000',
    biayaSatuan: '399', scrapPercent: '0',
  }),
  blankBomRow({
    id: 'r12', level: 'part', levelNum: 2, parentId: 'r4', no: 12, mod: '1.3.1', subMod: '1.3.1',
    partCode: '1227310-1.3.0.3.10', modul: 'KAKI', description: 'KAKI DEPAN', unit: 'EA',
    material: 'MINDI - 30 UP', supplier: 'VILLAGE - KP', qty: '2',
    dimAP: '430', dimAL: '45', dimAT: '45',
    workCenterOrRouting: 'LATHE', workCenterRunMin: '0.86',
    biayaSatuan: '8693', scrapPercent: '0',
  }),
  blankBomRow({
    id: 'r13', level: 'part', levelNum: 2, parentId: 'r4', no: 13, mod: '1.3.2', subMod: '1.3.2',
    partCode: '1227310-1.3.0.3.11', modul: 'KAKI', description: 'SUNDUK KAKI DEPAN', unit: 'EA',
    material: 'MINDI - 30 UP', supplier: 'VILLAGE - KP', qty: '1',
    dimAP: '495', dimAL: '25', dimAT: '25',
    workCenterOrRouting: 'LATHE', workCenterRunMin: '0.50',
    biayaSatuan: '3089', scrapPercent: '0',
  }),
  blankBomRow({
    id: 'r14', level: 'part', levelNum: 2, parentId: 'r4', no: 14, mod: '1.3.3', subMod: '1.3.3',
    partCode: '1227310-1.3.0.3.12', modul: 'KAKI', description: 'KAKI BELAKANG', unit: 'EA',
    material: 'MINDI - 30 UP', supplier: 'VILLAGE - KP', qty: '2',
    dimAP: '650', dimAL: '45', dimAT: '45',
    workCenterOrRouting: 'LATHE', workCenterRunMin: '1.30',
    biayaSatuan: '13141', scrapPercent: '0',
  }),
  blankBomRow({
    id: 'r15', level: 'part', levelNum: 2, parentId: 'r2', no: 15, mod: '1.1.2', subMod: '1.1.2',
    partCode: '1227310-3.2.0.20.2', modul: 'SANDARAN', description: 'PANEL SANDARAN', unit: 'EA',
    material: 'PLYWOOD 3 MM', supplier: 'LOCAL', qty: '5',
    dimAP: '1130', dimAL: '460', dimAT: '3',
    biayaSatuan: '15530', scrapPercent: '10',
  }),
  blankBomRow({
    id: 'r16', level: 'part', levelNum: 2, parentId: 'r3', no: 16, mod: '1.2.7', subMod: '1.2.7',
    partCode: '1227310-3.2.0.18.9', modul: 'DUDUKAN', description: 'PANEL DUDUKAN', unit: 'EA',
    material: 'PLYWOOD 3 MM', supplier: 'LOCAL', qty: '4',
    dimAP: '620', dimAL: '465', dimAT: '3',
    biayaSatuan: '8613', scrapPercent: '10',
  }),
];

export const defaultHardwareRows: HardwareRow[] = [
  { id: 'h1', no: 1, partCode: '004-008-001-003', description: 'LEM EPOXY SET', material: 'HARDWARE', jenisHardware: 'ASSEMBLING', qty: '0.168', unit: 'KG', unitCost: '106260', totalCost: '17863', keterangan: '' },
  { id: 'h2', no: 2, partCode: '006-001-001-003', description: 'Amplas 150', material: 'HARDWARE', jenisHardware: 'ASSEMBLING', qty: '1', unit: 'LBR', unitCost: '3098', totalCost: '3098', keterangan: '' },
  { id: 'h3', no: 3, partCode: '005-016-002-008', description: 'Screw FAB 6 x 1 1/4', material: 'HARDWARE', jenisHardware: 'ASSEMBLING', qty: '14', unit: 'PCS', unitCost: '63', totalCost: '882', keterangan: '' },
  { id: 'h4', no: 4, partCode: '005-016-002-005', description: 'Screw FAB 6 x 1 3/4', material: 'HARDWARE', jenisHardware: 'ASSEMBLING', qty: '4', unit: 'PCS', unitCost: '105', totalCost: '420', keterangan: '' },
  { id: 'h5', no: 5, partCode: '005-016-002-007', description: 'Screw FAB 6 x 1', material: 'HARDWARE', jenisHardware: 'ASSEMBLING', qty: '4', unit: 'PCS', unitCost: '62', totalCost: '249', keterangan: '' },
];

export const defaultOperations: Operation[] = [
  { id: 'op1', no: 1, name: 'Cutting Panel', workCenter: 'WC-CUTTING', routing: 'RTG-CUT', setupMin: '10', runMin: '30', costPerHour: '900000', totalCost: '600000', linkedComponentIds: [] },
  { id: 'op2', no: 2, name: 'Assembly', workCenter: 'WC-ASSEMBLY', routing: 'RTG-ASSEM', setupMin: '15', runMin: '45', costPerHour: '850000', totalCost: '850000', linkedComponentIds: [] },
  { id: 'op3', no: 3, name: 'Sanding & Finishing', workCenter: 'WC-FINISH', routing: 'RTG-FINISH', setupMin: '5', runMin: '25', costPerHour: '750000', totalCost: '375000', linkedComponentIds: [] },
];

export const STORAGE_KEY = 'bom-app-state';
export const DENSITY_KEY = 'bom-app-density';

export function generateRowId(): string {
  return 'r' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

export function generateHardwareId(): string {
  return 'h' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

export function createMejaTemplate(): BomRow[] {
  const rows = defaultBomRows.map((r) => ({ ...r }));
  const idMap: Record<string, string> = {};
  rows.forEach((r) => {
    const newId = generateRowId();
    idMap[r.id] = newId;
    r.id = newId;
  });
  rows.forEach((r) => {
    if (r.parentId && idMap[r.parentId]) r.parentId = idMap[r.parentId];
  });
  return rows.map((r) => recomputeRow(normalizeBomRow(r)));
}

export const defaultPackingInfo: PackingInfo = {
  outerBoxP: '', outerBoxL: '', outerBoxT: '', outerBoxVolM3: '',
  grossWeight: '', netWeight: '', packingMethod: 'Carton Box',
  loadPerContainer20: '', loadPerContainer40: '', packingCostTotal: '',
};

export const SAMPLE_PRODUCTS = [
  { id: 'meja-belajar', name: 'Meja Belajar', metadata: defaultMetadata, bomRows: defaultBomRows, hardwareRows: defaultHardwareRows, operations: defaultOperations },
];
