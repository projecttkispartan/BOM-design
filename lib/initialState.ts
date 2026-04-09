import type { BomRow, BomMetadata, HardwareRow, Operation, PackingInfo } from '@/types';
import { normalizeBomRow } from './normalizeBomRow';
import { recomputeRow } from './calculations';

export const defaultMetadata: BomMetadata = {
  productCode: 'MB-120',
  productName: 'MEJA BELAJAR',
  productDisplay: '[MB-120] MEJA BELAJAR',
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
  leadTime: '',
  effectiveDate: '',
  expiryDate: '',
  customer: '',
  buyerCode: '',
  company: 'Demo Company',
  itemType: 'TABLE',
  wood: 'KAYU SOLID',
  coatingColor: 'NATURAL',
  itemDim: '1200 x 600 x 750',
  itemWidth: '1200',
  itemDepth: '600',
  itemHeight: '750',
  volM3: '0.5400',
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
    modul: 'MEJA BELAJAR', description: 'MEJA BELAJAR', unit: 'EA', partCode: 'MB-120',
    pusatBiaya: 'PRODUKSI',
    workCenterOrRouting: 'WC-ASSEMBLY', workCenterSetupMin: '20', workCenterRunMin: '45', workCenterCost: '150000',
    routingName: 'RTG-FINAL-QC', routingSetupMin: '5', routingRunMin: '15', routingCost: '50000',
    surface: 'Lacquer Natural', surfaceCost: '165000',
    edging: 'PVC 2mm', edgingTimeMin: '30', edgingCost: '45000',
    finishing: 'Lacquer Natural', finishingTimeMin: '60', finishingCost: '120000',
    treatment: 'Anti Rayap + Kiln Dry',
    leadTime: '3', supplier: 'Internal', revision: 'A', drawingRef: 'DRW-MB-120',
    keterangan: 'Produk jadi meja belajar',
  }),
  blankBomRow({
    id: 'r2', level: 'submodule', levelNum: 1, parentId: 'r1', no: 2, mod: '1.1', subMod: '1.1',
    modul: 'MEJA BELAJAR', description: 'PAPAN ATAS', unit: 'SET', partCode: 'MB-120-TOP',
    workCenterOrRouting: 'WC-CUTTING', workCenterSetupMin: '8', workCenterRunMin: '15', workCenterCost: '85000',
    routingName: 'RTG-PANEL', routingSetupMin: '3', routingRunMin: '10', routingCost: '35000',
    surface: 'Sanding + Lacquer', surfaceCost: '87000',
    edging: 'PVC 2mm', edgingTimeMin: '18', edgingCost: '32000',
    finishing: 'Sanding + Lacquer', finishingTimeMin: '25', finishingCost: '55000',
    treatment: 'Kiln Dry',
    keterangan: 'Sub assembly papan meja',
  }),
  blankBomRow({
    id: 'r3', level: 'part', levelNum: 2, parentId: 'r2', no: 3, mod: '1.1.1', subMod: '1.1.1',
    partCode: 'MB-TOP-001', modul: 'PAPAN ATAS', description: 'Papan kayu top (solid)', unit: 'EA',
    material: 'KAYU SOLID', qty: '1', dimAP: '1200', dimAL: '600', dimAT: '18',
    jenis: 'LURUS', grade: 'A', sisiEdging: '4',
    workCenterOrRouting: 'WC-CUTTING', workCenterSetupMin: '5', workCenterRunMin: '12', workCenterCost: '65000',
    routingName: 'RTG-CUT-PANEL', routingSetupMin: '2', routingRunMin: '8', routingCost: '28000',
    surface: 'Sanding P120 + Lacquer', surfaceCost: '70000',
    edging: 'PVC 2mm 4 sisi', edgingTimeMin: '15', edgingCost: '28000',
    finishing: 'Sanding P120 + Lacquer', finishingTimeMin: '20', finishingCost: '42000',
    treatment: 'Anti Rayap + Kiln Dry',
    assembling: 'Lem + Sekrup', assemblingTimeMin: '10', biayaSatuan: '185000',
    leadTime: '2', supplier: 'PT Kayu Jati', keterangan: 'Panel utama meja',
  }),
  blankBomRow({
    id: 'r4', level: 'part', levelNum: 2, parentId: 'r2', no: 4, mod: '1.1.2', subMod: '1.1.2',
    partCode: 'MB-TOP-002', modul: 'PAPAN ATAS', description: 'Baut sekrup 6x40', unit: 'EA',
    material: 'HARDWARE', qty: '8', assemblingTimeMin: '2', biayaSatuan: '2500',
    keterangan: 'Baut sekrup 6x40',
  }),
  blankBomRow({
    id: 'r5', level: 'submodule', levelNum: 1, parentId: 'r1', no: 5, mod: '1.2', subMod: '1.2',
    modul: 'MEJA BELAJAR', description: 'KAKI', unit: 'SET', partCode: 'MB-120-KAKI',
    workCenterOrRouting: 'WC-ASSEMBLY', workCenterSetupMin: '10', workCenterRunMin: '20', workCenterCost: '75000',
    routingName: 'RTG-KAKI', routingSetupMin: '3', routingRunMin: '8', routingCost: '25000',
    surface: 'Sanding + Stain', surfaceCost: '53000',
    edging: 'PVC 0.5mm', edgingTimeMin: '10', edgingCost: '18000',
    finishing: 'Sanding + Stain', finishingTimeMin: '15', finishingCost: '35000',
    treatment: 'Anti Rayap',
    keterangan: 'Sub assembly kaki',
  }),
  blankBomRow({
    id: 'r6', level: 'part', levelNum: 2, parentId: 'r5', no: 6, mod: '1.2.1', subMod: '1.2.1',
    partCode: 'MB-KAKI-01', modul: 'KAKI', description: 'Kaki kiri (kayu solid)', unit: 'EA',
    material: 'KAYU SOLID', qty: '1', dimAP: '720', dimAL: '50', dimAT: '50',
    jenis: 'TENON', grade: 'A',
    workCenterOrRouting: 'WC-LATHE', workCenterSetupMin: '3', workCenterRunMin: '8', workCenterCost: '45000',
    routingName: 'RTG-TURNING', routingSetupMin: '2', routingRunMin: '6', routingCost: '20000',
    surface: 'Sanding P180 + Stain Oak', surfaceCost: '22000',
    finishing: 'Sanding P180 + Stain Oak', finishingTimeMin: '10', finishingCost: '22000',
    treatment: 'Anti Rayap + Kiln Dry',
    biayaSatuan: '95000', keterangan: 'Kaki kiri 72 cm',
  }),
  blankBomRow({
    id: 'r7', level: 'part', levelNum: 2, parentId: 'r5', no: 7, mod: '1.2.2', subMod: '1.2.2',
    partCode: 'MB-KAKI-02', modul: 'KAKI', description: 'Kaki kanan (kayu solid)', unit: 'EA',
    material: 'KAYU SOLID', qty: '1', dimAP: '720', dimAL: '50', dimAT: '50',
    jenis: 'TENON', grade: 'A',
    workCenterOrRouting: 'WC-LATHE', workCenterSetupMin: '3', workCenterRunMin: '8', workCenterCost: '45000',
    routingName: 'RTG-TURNING', routingSetupMin: '2', routingRunMin: '6', routingCost: '20000',
    surface: 'Sanding P180 + Stain Oak', surfaceCost: '22000',
    finishing: 'Sanding P180 + Stain Oak', finishingTimeMin: '10', finishingCost: '22000',
    treatment: 'Anti Rayap + Kiln Dry',
    biayaSatuan: '95000', keterangan: 'Kaki kanan 72 cm',
  }),
];

export const defaultHardwareRows: HardwareRow[] = [
  { id: 'h1', no: 1, partCode: '005-001-022-010', description: 'Plat ID Number LVLK', material: 'HARDWARE', jenisHardware: 'FITTING', qty: '1', keterangan: 'Tag identitas' },
  { id: 'h2', no: 2, partCode: 'HV-35-001', description: 'Engsel 35 mm', material: 'HARDWARE', jenisHardware: 'FITTING', qty: '4', keterangan: '' },
  { id: 'h3', no: 3, partCode: '005-016-002-005', description: 'Screw FAB 6 x 1 3/4', material: 'HARDWARE', jenisHardware: 'ASSEMBLING', qty: '24', keterangan: '' },
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
