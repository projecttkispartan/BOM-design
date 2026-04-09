/** eCount ERP: unit satuan umum (EA, SET, KG, M, M2, L, PCS) */
export const ECOUNT_UNITS = ['EA', 'SET', 'KG', 'M', 'M2', 'L', 'PCS'];

/** eCount ERP: tipe item di BOM */
export const ECOUNT_ITEM_TYPES = [
  { value: 'finished', label: 'Produk Jadi', levelNum: 0 },
  { value: 'sub_assembly', label: 'Sub Assembly', levelNum: 1 },
  { value: 'raw', label: 'Bahan Baku', levelNum: 2 },
];

export const defaultMetadata = {
  productCode: 'MB-120',
  productName: 'MEJA BELAJAR',
  productDisplay: '[MB-120] MEJA BELAJAR',
  reference: '',
  productVariant: 'Standard',
  bomType: 'manufacture',
  barangProduksi: '1 Set',
  proses: '',
  versiBom: '1',
  defaultVersi: false,
  bomQuantity: '1',
  bomUnit: 'EA',
  customer: '',
  company: 'Demo Company',
  itemType: 'MEJA BELAJAR',
  wood: 'KAYU SOLID + MDF',
  coatingColor: 'NATURAL',
  itemDim: '1200 x 600 x 750',
  volM3: '0.054',
};

/** Tipe proses di routing: finishing, glue_area, packing, other */
export const ROUTING_PROCESS_TYPES = [
  { value: 'finishing', label: 'Finishing' },
  { value: 'glue_area', label: 'Glue Area' },
  { value: 'packing', label: 'Packing' },
  { value: 'other', label: 'Lainnya' },
];

export function generateRoutingStepId() {
  return 'rs_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

const blankRoutingStep = () => ({
  id: generateRoutingStepId(),
  process: 'other',
  setupTimeMin: '',
  runTimeMin: '',
  costSetup: '',
  costPerUnit: '',
  notes: '',
});

const blankBomRow = (overrides = {}) => ({
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
  sisiVen: '', sisiEdg: '', grVen: '', laminasi: '', glueArea: '', assembling: '', finNo: '', finishing: '', jnsKomp: '', wbs: '',
  workCenterOrRouting: '',
  workCenterSetupMin: '',
  workCenterRunMin: '',
  routingSetupMin: '',
  routingRunMin: '',
  assemblingTimeMin: '',
  glueAreaTimeMin: '',
  ketProses: '',
  keterangan: '',
  versiBom: '',
  pusatBiaya: '',
  perawatan: '',
  manufacture: '',
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
  infoBom: '',
  applyOnVariants: false,
  routingSteps: [],
  dimAP: '', dimAL: '', dimAT: '', dimBP: '', dimBL: '', dimBT: '', dimCP: '', dimCL: '', dimCT: '', dimDP: '', dimDL: '', dimDT: '',
  prodKode: '', prodP: '', prodL: '', prodT: '',
  qtyPart: '', qty: '', mLari: '', m2: '', volCut: '', volInv: '', procCode: '',
  ...overrides,
});

const sampleRoutingSteps = (steps) =>
  steps.map((s) => ({
    id: generateRoutingStepId(),
    ...s,
  }));

/**
 * Sample BOM: MEJA BELAJAR — hierarki Modul → Submodul → Part.
 * Kalkulasi real: dimensi (mm), volume (m³), biaya (Rp), waktu (menit).
 */
export const defaultBomRows = [
  // ========== MODUL: MEJA BELAJAR (level 0) ==========
  blankBomRow({
    id: 'r1',
    level: 'module',
    levelNum: 0,
    parentId: null,
    no: 1,
    mod: '1',
    subMod: '',
    modul: 'MEJA BELAJAR',
    description: 'MEJA BELAJAR',
    unit: 'EA',
    partCode: 'MB-120',
    pusatBiaya: 'PRODUKSI',
    workCenterOrRouting: 'Assembly Meja Belajar',
    workCenterSetupMin: '20',
    workCenterRunMin: '45',
    routingSetupMin: '10',
    routingRunMin: '35',
    assembling: 'Final assembly',
    assemblingTimeMin: '25',
    glueArea: '-',
    glueAreaTimeMin: '',
    leadTime: '3',
    supplier: 'Internal',
    revision: 'A',
    drawingRef: 'DRW-MB-120',
    keterangan: 'Produk jadi meja belajar ukuran 120x60x75 cm',
  }),

  // ========== SUBMODUL 1: PAPAN ATAS (level 1, parent r1) ==========
  blankBomRow({
    id: 'r2',
    level: 'submodule',
    levelNum: 1,
    parentId: 'r1',
    no: 2,
    mod: '1.1',
    subMod: '1.1',
    modul: 'MEJA BELAJAR',
    description: 'PAPAN ATAS',
    unit: 'SET',
    partCode: 'MB-120-TOP',
    pusatBiaya: 'PRODUKSI',
    workCenterOrRouting: 'Assembly Top',
    workCenterSetupMin: '8',
    workCenterRunMin: '15',
    routingSetupMin: '5',
    routingRunMin: '12',
    assembling: 'Lem + sekrup',
    assemblingTimeMin: '8',
    glueArea: 'Pinggir panel',
    glueAreaTimeMin: '5',
    leadTime: '1',
    supplier: 'Internal',
    revision: 'A',
    drawingRef: 'DRW-MB-TOP',
    keterangan: 'Sub assembly papan meja',
  }),
  blankBomRow({
    id: 'r3',
    level: 'part',
    levelNum: 2,
    parentId: 'r2',
    no: 3,
    mod: '1.1.1',
    subMod: '1.1.1',
    partCode: 'MB-TOP-001',
    modul: 'PAPAN ATAS',
    description: 'Papan kayu top (solid)',
    unit: 'EA',
    material: 'KAYU SOLID',
    kodeMat: 'JATI',
    qty: '1',
    dimAP: '1200', dimAL: '600', dimAT: '18',
    volCut: '0.0130',
    assembling: 'Lem + Sekrup',
    assemblingTimeMin: '10',
    glueArea: 'Pinggir',
    glueAreaTimeMin: '6',
    leadTime: '2',
    supplier: 'PT Kayu Jati',
    revision: 'A',
    drawingRef: 'MB-TOP-001',
    biayaSatuan: '185000',
    unitCostTimeMin: '15',
    biayaMesin: '25000',
    machineCostTimeMin: '8',
    biayaTenagaKerja: '18000',
    laborCostTimeMin: '10',
    keterangan: 'Panel utama meja, finishing natural',
  }),
  blankBomRow({
    id: 'r4',
    level: 'part',
    levelNum: 2,
    parentId: 'r2',
    no: 4,
    mod: '1.1.2',
    subMod: '1.1.2',
    partCode: 'MB-TOP-002',
    modul: 'PAPAN ATAS',
    description: 'Strip lis pinggir (P x 2)',
    unit: 'EA',
    material: 'KAYU',
    kodeMat: 'MN',
    qty: '2',
    dimAP: '1200', dimAL: '25', dimAT: '18',
    volCut: '0.0011',
    assembling: 'Lem',
    assemblingTimeMin: '4',
    glueArea: 'Pinggir',
    glueAreaTimeMin: '3',
    leadTime: '1',
    supplier: 'PT Kayu Jati',
    biayaSatuan: '32000',
    unitCostTimeMin: '5',
    keterangan: 'Lis penutup tepi panel',
  }),
  blankBomRow({
    id: 'r4a',
    level: 'part',
    levelNum: 2,
    parentId: 'r2',
    no: 5,
    mod: '1.1.3',
    subMod: '1.1.3',
    partCode: 'MB-TOP-BAUT',
    modul: 'PAPAN ATAS',
    description: 'Baut',
    unit: 'EA',
    material: 'HARDWARE',
    qty: '8',
    assembling: 'Sekrup',
    assemblingTimeMin: '2',
    leadTime: '0',
    supplier: 'PT Hardware',
    biayaSatuan: '2500',
    keterangan: 'Baut sekrup 6x40',
  }),
  blankBomRow({
    id: 'r4b',
    level: 'part',
    levelNum: 2,
    parentId: 'r2',
    no: 6,
    mod: '1.1.4',
    subMod: '1.1.4',
    partCode: 'MB-TOP-PAPAN3M',
    modul: 'PAPAN ATAS',
    description: 'Papan 3m',
    unit: 'EA',
    material: 'KAYU',
    qty: '0.4',
    dimAP: '3000', dimAL: '600', dimAT: '18',
    volCut: '0.0324',
    assembling: 'Potong + lem',
    assemblingTimeMin: '12',
    leadTime: '2',
    supplier: 'PT Kayu Jati',
    biayaSatuan: '450000',
    keterangan: 'Papan 3m dipotong per kebutuhan',
  }),
  blankBomRow({
    id: 'r4c',
    level: 'part',
    levelNum: 2,
    parentId: 'r2',
    no: 7,
    mod: '1.1.5',
    subMod: '1.1.5',
    partCode: 'MB-TOP-LEM',
    modul: 'PAPAN ATAS',
    description: 'Lem',
    unit: 'KG',
    material: 'KIMIA',
    qty: '0.15',
    assembling: 'Lem',
    assemblingTimeMin: '5',
    glueArea: 'Pinggir',
    glueAreaTimeMin: '4',
    leadTime: '0',
    supplier: 'PT Kimia',
    biayaSatuan: '85000',
    keterangan: 'Lem kayu untuk sambungan',
  }),

  // ========== SUBMODUL 2: KAKI (level 1, parent r1) ==========
  blankBomRow({
    id: 'r5',
    level: 'submodule',
    levelNum: 1,
    parentId: 'r1',
    no: 8,
    mod: '1.2',
    subMod: '1.2',
    modul: 'MEJA BELAJAR',
    description: 'KAKI',
    unit: 'SET',
    partCode: 'MB-120-KAKI',
    pusatBiaya: 'PRODUKSI',
    workCenterOrRouting: 'Assembly Kaki',
    workCenterSetupMin: '10',
    workCenterRunMin: '20',
    routingSetupMin: '5',
    routingRunMin: '18',
    assembling: 'Tenon + lem',
    assemblingTimeMin: '12',
    glueArea: 'Sambungan',
    glueAreaTimeMin: '8',
    leadTime: '1',
    supplier: 'Internal',
    revision: 'A',
    drawingRef: 'DRW-MB-KAKI',
    keterangan: 'Sub assembly 2 kaki + palang',
  }),
  blankBomRow({
    id: 'r6',
    level: 'part',
    levelNum: 2,
    parentId: 'r5',
    no: 9,
    mod: '1.2.1',
    subMod: '1.2.1',
    partCode: 'MB-KAKI-01',
    modul: 'KAKI',
    description: 'Kaki kiri (kayu solid)',
    unit: 'EA',
    material: 'KAYU SOLID',
    kodeMat: 'JATI',
    qty: '1',
    dimAP: '720', dimAL: '50', dimAT: '50',
    volCut: '0.0018',
    assembling: 'Tenon',
    assemblingTimeMin: '6',
    leadTime: '2',
    supplier: 'PT Kayu Jati',
    biayaSatuan: '95000',
    unitCostTimeMin: '12',
    biayaMesin: '15000',
    machineCostTimeMin: '5',
    keterangan: 'Kaki kiri 72 cm',
  }),
  blankBomRow({
    id: 'r7',
    level: 'part',
    levelNum: 2,
    parentId: 'r5',
    no: 10,
    mod: '1.2.2',
    subMod: '1.2.2',
    partCode: 'MB-KAKI-02',
    modul: 'KAKI',
    description: 'Kaki kanan (kayu solid)',
    unit: 'EA',
    material: 'KAYU SOLID',
    kodeMat: 'JATI',
    qty: '1',
    dimAP: '720', dimAL: '50', dimAT: '50',
    volCut: '0.0018',
    assembling: 'Tenon',
    assemblingTimeMin: '6',
    leadTime: '2',
    supplier: 'PT Kayu Jati',
    biayaSatuan: '95000',
    unitCostTimeMin: '12',
    keterangan: 'Kaki kanan 72 cm',
  }),
  blankBomRow({
    id: 'r8',
    level: 'part',
    levelNum: 2,
    parentId: 'r5',
    no: 11,
    mod: '1.2.3',
    subMod: '1.2.3',
    partCode: 'MB-KAKI-03',
    modul: 'KAKI',
    description: 'Palang penguat depan',
    unit: 'EA',
    material: 'KAYU',
    kodeMat: 'MN',
    qty: '1',
    dimAP: '560', dimAL: '40', dimAT: '40',
    volCut: '0.0009',
    assembling: 'Lem + sekrup',
    assemblingTimeMin: '5',
    glueArea: 'Sambungan',
    glueAreaTimeMin: '4',
    leadTime: '1',
    supplier: 'PT Kayu Jati',
    biayaSatuan: '42000',
    unitCostTimeMin: '8',
    keterangan: 'Palang depan 56 cm',
  }),
  blankBomRow({
    id: 'r9',
    level: 'part',
    levelNum: 2,
    parentId: 'r5',
    no: 12,
    mod: '1.2.4',
    subMod: '1.2.4',
    partCode: 'MB-KAKI-04',
    modul: 'KAKI',
    description: 'Palang penguat belakang',
    unit: 'EA',
    material: 'KAYU',
    kodeMat: 'MN',
    qty: '1',
    dimAP: '560', dimAL: '40', dimAT: '40',
    volCut: '0.0009',
    assembling: 'Lem + sekrup',
    assemblingTimeMin: '5',
    glueArea: 'Sambungan',
    glueAreaTimeMin: '4',
    leadTime: '1',
    supplier: 'PT Kayu Jati',
    biayaSatuan: '42000',
    unitCostTimeMin: '8',
    keterangan: 'Palang belakang 56 cm',
  }),

  // ========== SUBMODUL 3: LACI (level 1, parent r1) ==========
  blankBomRow({
    id: 'r10',
    level: 'submodule',
    levelNum: 1,
    parentId: 'r1',
    no: 13,
    mod: '1.3',
    subMod: '1.3',
    modul: 'MEJA BELAJAR',
    description: 'LACI',
    unit: 'SET',
    partCode: 'MB-120-LACI',
    pusatBiaya: 'PRODUKSI',
    workCenterOrRouting: 'Assembly Laci',
    workCenterSetupMin: '12',
    workCenterRunMin: '25',
    routingSetupMin: '6',
    routingRunMin: '20',
    assembling: 'Lem + rel',
    assemblingTimeMin: '15',
    glueArea: 'Sambungan MDF',
    glueAreaTimeMin: '10',
    leadTime: '1',
    supplier: 'Internal',
    revision: 'A',
    drawingRef: 'DRW-MB-LACI',
    keterangan: 'Sub assembly 1 laci dengan rel',
  }),
  blankBomRow({
    id: 'r11',
    level: 'part',
    levelNum: 2,
    parentId: 'r10',
    no: 14,
    mod: '1.3.1',
    subMod: '1.3.1',
    partCode: 'MB-LACI-01',
    modul: 'LACI',
    description: 'Dinding laci (MDF) 4 sisi',
    unit: 'SET',
    material: 'MDF',
    kodeMat: 'MDF18',
    qty: '1',
    dimAP: '500', dimAL: '350', dimAT: '120',
    volCut: '0.0210',
    assembling: 'Lem',
    assemblingTimeMin: '15',
    glueArea: 'Sambungan',
    glueAreaTimeMin: '10',
    leadTime: '2',
    supplier: 'CV MDF Indo',
    biayaSatuan: '88000',
    unitCostTimeMin: '18',
    biayaMesin: '12000',
    machineCostTimeMin: '6',
    keterangan: 'Badan laci 50x35x12 cm',
  }),
  blankBomRow({
    id: 'r12',
    level: 'part',
    levelNum: 2,
    parentId: 'r10',
    no: 15,
    mod: '1.3.2',
    subMod: '1.3.2',
    partCode: 'MB-LACI-02',
    modul: 'LACI',
    description: 'Dasar laci (MDF)',
    unit: 'EA',
    material: 'MDF',
    kodeMat: 'MDF12',
    qty: '1',
    dimAP: '480', dimAL: '330', dimAT: '12',
    volCut: '0.0019',
    assembling: 'Lem',
    assemblingTimeMin: '5',
    leadTime: '1',
    supplier: 'CV MDF Indo',
    biayaSatuan: '35000',
    unitCostTimeMin: '6',
    keterangan: 'Dasar laci 48x33 cm',
  }),
  blankBomRow({
    id: 'r13',
    level: 'part',
    levelNum: 2,
    parentId: 'r10',
    no: 16,
    mod: '1.3.3',
    subMod: '1.3.3',
    partCode: 'MB-LACI-03',
    modul: 'LACI',
    description: 'Rel laci (pair)',
    unit: 'SET',
    material: 'HARDWARE',
    kodeMat: 'RL-350',
    qty: '1',
    leadTime: '0',
    supplier: 'PT Hardware',
    biayaSatuan: '45000',
    keterangan: 'Rel full extension 35 cm',
  }),

  // ========== SUBMODUL 4: SANDAran (level 1, parent r1) ==========
  blankBomRow({
    id: 'r14',
    level: 'submodule',
    levelNum: 1,
    parentId: 'r1',
    no: 17,
    mod: '1.4',
    subMod: '1.4',
    modul: 'MEJA BELAJAR',
    description: 'SANDAran',
    unit: 'SET',
    partCode: 'MB-120-SAN',
    pusatBiaya: 'PRODUKSI',
    workCenterOrRouting: 'Assembly Sandaran',
    workCenterSetupMin: '6',
    workCenterRunMin: '12',
    routingSetupMin: '4',
    routingRunMin: '10',
    assembling: 'Sekrup ke papan atas',
    assemblingTimeMin: '6',
    glueArea: '-',
    glueAreaTimeMin: '',
    leadTime: '1',
    supplier: 'Internal',
    revision: 'A',
    drawingRef: 'DRW-MB-SAN',
    keterangan: 'Sub assembly sandaran belakang',
  }),
  blankBomRow({
    id: 'r15',
    level: 'part',
    levelNum: 2,
    parentId: 'r14',
    no: 18,
    mod: '1.4.1',
    subMod: '1.4.1',
    partCode: 'MB-SAN-01',
    modul: 'SANDAran',
    description: 'Papan sandaran (MDF laminated)',
    unit: 'EA',
    material: 'MDF',
    kodeMat: 'MDF18-LAM',
    qty: '1',
    dimAP: '1200', dimAL: '280', dimAT: '18',
    volCut: '0.0060',
    assembling: 'Sekrup',
    assemblingTimeMin: '8',
    glueArea: '-',
    glueAreaTimeMin: '5',
    leadTime: '2',
    supplier: 'CV MDF Indo',
    revision: 'A',
    drawingRef: 'MB-SAN-01',
    biayaSatuan: '125000',
    unitCostTimeMin: '14',
    biayaMesin: '18000',
    machineCostTimeMin: '7',
    keterangan: 'Panel sandaran 120x28 cm, laminated',
  }),
];

/** Clone pohon Meja Belajar dengan ID baru; untuk aksi "Tambah Meja" di halaman Komponen. */
export function createMejaTemplate() {
  const rows = defaultBomRows.map((r) => ({ ...r }));
  const idMap = {};
  rows.forEach((r) => {
    const newId = generateRowId();
    idMap[r.id] = newId;
    r.id = newId;
  });
  rows.forEach((r) => {
    if (r.parentId && idMap[r.parentId]) r.parentId = idMap[r.parentId];
  });
  return rows.map(normalizeBomRow);
}

/**
 * Sample data Hardware — untuk tab Miscellaneous.
 * NO, Kode, DESKRIPSI, MATERIAL, JENIS HARDWARE (FITTING / ASSEMBLING), Qty, Keterangan.
 */
export const defaultHardwareRows = [
  { id: 'h1', no: 1, partCode: '005-001-022-010', description: 'Plat ID Number LVLK', material: 'HARDWARE', jenisHardware: 'FITTING', qty: '1', keterangan: 'Tag identitas produk' },
  { id: 'h2', no: 2, partCode: 'HV-35-001', description: 'Engsel pintu 35 mm', material: 'HARDWARE', jenisHardware: 'FITTING', qty: '4', keterangan: 'Engsel penyekat' },
  { id: 'h3', no: 3, partCode: '005-016-002-005', description: 'Screw FAB 6 x 1 3/4', material: 'HARDWARE', jenisHardware: 'FITTING', qty: '24', keterangan: 'Sekrup panel' },
  { id: 'h4', no: 4, partCode: '005-000-006-011', description: 'Screw FAB 6 x 1 1/4', material: 'HARDWARE', jenisHardware: 'ASSEMBLING', qty: '32', keterangan: 'Sekrup assembling papan' },
  { id: 'h5', no: 5, partCode: '005-016-002-008', description: 'Screw FAB 6 x 1', material: 'HARDWARE', jenisHardware: 'ASSEMBLING', qty: '16', keterangan: 'Sekrup tipis MDF' },
  { id: 'h6', no: 6, partCode: 'RL-350-FE', description: 'Rel laci full extension 350 mm', material: 'HARDWARE', jenisHardware: 'FITTING', qty: '1', keterangan: 'Set rel laci' },
  { id: 'h7', no: 7, partCode: 'KAKI-ADJ-001', description: 'Kaki adjustable 30–50 mm', material: 'HARDWARE', jenisHardware: 'FITTING', qty: '4', keterangan: 'Kaki plastik putih' },
  { id: 'h8', no: 8, partCode: '005-001-012-045', description: 'Sepatu kaki (foot pad)', material: 'HARDWARE', jenisHardware: 'FITTING', qty: '4', keterangan: 'Sepatu putih diameter 30 mm' },
  { id: 'h9', no: 9, partCode: 'PLUG-6', description: 'Plug kayu 6 mm', material: 'HARDWARE', jenisHardware: 'FITTING', qty: '20', keterangan: 'Penutup lubang sekrup' },
  { id: 'h10', no: 10, partCode: 'NAIL-TAG', description: 'Nail for tag', material: 'HARDWARE', jenisHardware: 'FITTING', qty: '1', keterangan: 'Pakai tag ID' },
];

/** Sample metadata untuk produk lain (Lemari) — bisa dipakai untuk "Load sample". */
export const sampleMetadataLemari = {
  productCode: 'LM-200',
  productName: 'LEMARI Pakaian',
  productDisplay: '[LM-200] LEMARI Pakaian',
  reference: '',
  productVariant: '2 Pintu',
  bomType: 'manufacture',
  barangProduksi: '1 Unit',
  proses: '',
  versiBom: '1',
  defaultVersi: false,
  bomQuantity: '1',
  bomUnit: 'EA',
  customer: '',
  company: 'Demo Company',
  itemType: 'LEMARI',
  wood: 'MDF + KAYU',
  coatingColor: 'PUTIH',
  itemDim: '2000 x 800 x 550',
  volM3: '0.88',
};

/** Sample BOM Lemari — Modul → Submodul → Part (struktur singkat). */
export const sampleBomRowsLemari = [
  blankBomRow({ id: 'lr1', level: 'module', levelNum: 0, parentId: null, no: 1, mod: '1', modul: 'LEMARI Pakaian', description: 'LEMARI Pakaian', unit: 'EA', partCode: 'LM-200', pusatBiaya: 'PRODUKSI', workCenterOrRouting: 'Assembly Lemari', workCenterSetupMin: '30', workCenterRunMin: '120', routingSetupMin: '15', routingRunMin: '90', leadTime: '5', supplier: 'Internal', revision: 'A', drawingRef: 'DRW-LM-200', keterangan: 'Lemari 2 pintu 200x80x55 cm' }),
  blankBomRow({ id: 'lr2', level: 'submodule', levelNum: 1, parentId: 'lr1', no: 2, mod: '1.1', subMod: '1.1', modul: 'LEMARI Pakaian', description: 'Badan Lemari', unit: 'SET', partCode: 'LM-200-BODY', pusatBiaya: 'PRODUKSI', workCenterOrRouting: 'Assembly Body', workCenterSetupMin: '15', workCenterRunMin: '45', routingSetupMin: '8', routingRunMin: '40', assembling: 'Lem + sekrup', assemblingTimeMin: '25', glueArea: 'Sambungan', glueAreaTimeMin: '12', leadTime: '2', supplier: 'Internal', drawingRef: 'DRW-LM-BODY', keterangan: 'Rangka utama lemari' }),
  blankBomRow({ id: 'lr3', level: 'part', levelNum: 2, parentId: 'lr2', no: 3, mod: '1.1.1', subMod: '1.1.1', partCode: 'LM-BODY-01', modul: 'Badan Lemari', description: 'Papan sisi kiri (MDF)', unit: 'EA', material: 'MDF', qty: '1', dimAP: '2000', dimAL: '550', dimAT: '18', volCut: '0.0198', assembling: 'Lem', assemblingTimeMin: '8', glueAreaTimeMin: '5', leadTime: '2', supplier: 'CV MDF Indo', biayaSatuan: '185000', unitCostTimeMin: '10', biayaMesin: '15000', machineCostTimeMin: '6', biayaTenagaKerja: '12000', laborCostTimeMin: '8', keterangan: 'Panel sisi 200x55 cm' }),
  blankBomRow({ id: 'lr4', level: 'part', levelNum: 2, parentId: 'lr2', no: 4, mod: '1.1.2', subMod: '1.1.2', partCode: 'LM-BODY-02', modul: 'Badan Lemari', description: 'Papan sisi kanan (MDF)', unit: 'EA', material: 'MDF', qty: '1', dimAP: '2000', dimAL: '550', dimAT: '18', volCut: '0.0198', assembling: 'Lem', assemblingTimeMin: '8', leadTime: '2', supplier: 'CV MDF Indo', biayaSatuan: '185000', keterangan: 'Panel sisi 200x55 cm' }),
  blankBomRow({ id: 'lr5', level: 'part', levelNum: 2, parentId: 'lr2', no: 5, mod: '1.1.3', subMod: '1.1.3', partCode: 'LM-BODY-03', modul: 'Badan Lemari', description: 'Papan atas & bawah', unit: 'EA', material: 'MDF', qty: '2', dimAP: '800', dimAL: '550', dimAT: '18', volCut: '0.0158', assembling: 'Lem + sekrup', assemblingTimeMin: '12', leadTime: '2', supplier: 'CV MDF Indo', biayaSatuan: '95000', keterangan: 'Atas + bawah 80x55 cm' }),
  blankBomRow({ id: 'lr6', level: 'submodule', levelNum: 1, parentId: 'lr1', no: 6, mod: '1.2', subMod: '1.2', modul: 'LEMARI Pakaian', description: 'Pintu Lemari', unit: 'SET', partCode: 'LM-200-DOOR', pusatBiaya: 'PRODUKSI', workCenterOrRouting: 'Assembly Pintu', workCenterSetupMin: '10', workCenterRunMin: '30', routingSetupMin: '5', routingRunMin: '25', assembling: 'Engsel + lem', assemblingTimeMin: '20', leadTime: '1', supplier: 'Internal', keterangan: '2 pintu dengan engsel' }),
  blankBomRow({ id: 'lr7', level: 'part', levelNum: 2, parentId: 'lr6', no: 7, mod: '1.2.1', subMod: '1.2.1', partCode: 'LM-DOOR-01', modul: 'Pintu Lemari', description: 'Panel pintu (MDF laminated)', unit: 'EA', material: 'MDF', qty: '2', dimAP: '990', dimAL: '2000', dimAT: '18', volCut: '0.0356', assembling: 'Engsel', assemblingTimeMin: '15', leadTime: '2', supplier: 'CV MDF Indo', biayaSatuan: '320000', keterangan: 'Pintu 99x200 cm x 2' }),
];

/** Sample hardware untuk Lemari. */
export const sampleHardwareRowsLemari = [
  { id: 'lh1', no: 1, partCode: 'HV-35-001', description: 'Engsel pintu 35 mm', material: 'HARDWARE', jenisHardware: 'FITTING', qty: '8', keterangan: '4 per pintu' },
  { id: 'lh2', no: 2, partCode: '005-016-002-005', description: 'Screw FAB 6 x 1 3/4', material: 'HARDWARE', jenisHardware: 'ASSEMBLING', qty: '48', keterangan: 'Sekrup panel & engsel' },
  { id: 'lh3', no: 3, partCode: 'HND-200', description: 'Handle pintu 200 mm', material: 'HARDWARE', jenisHardware: 'FITTING', qty: '2', keterangan: 'Handle stainless' },
  { id: 'lh4', no: 4, partCode: 'PLUG-6', description: 'Plug kayu 6 mm', material: 'HARDWARE', jenisHardware: 'FITTING', qty: '48', keterangan: 'Penutup lubang sekrup' },
];

/** Daftar sample produk: metadata + bomRows + hardwareRows. */
export const SAMPLE_PRODUCTS = [
  { id: 'meja-belajar', name: 'Meja Belajar', metadata: defaultMetadata, bomRows: defaultBomRows, hardwareRows: defaultHardwareRows },
  { id: 'lemari', name: 'Lemari Pakaian', metadata: sampleMetadataLemari, bomRows: sampleBomRowsLemari, hardwareRows: sampleHardwareRowsLemari },
];

export const STORAGE_KEY = 'bom-app-state';
export const DENSITY_KEY = 'bom-app-density';

export function generateRowId() {
  return 'r' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

export function generateHardwareId() {
  return 'h' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

export function levelToNum(level) {
  if (level === 'module') return 0;
  if (level === 'submodule') return 1;
  return 2;
}

export function normalizeBomRow(row) {
  const r = { ...row };
  if (r.levelNum == null) r.levelNum = levelToNum(r.level || 'part');
  if (r.parentId === undefined) r.parentId = row.parentId ?? null;
  if (r.expanded === undefined) r.expanded = true;
  if (r.unit === undefined || r.unit === '') r.unit = row.unit ?? 'EA';
  if (r.workCenterOrRouting === undefined) r.workCenterOrRouting = row.workCenterOrRouting ?? (row.workCenter ?? row.routing ?? '');
  if (r.workCenterSetupMin === undefined) r.workCenterSetupMin = row.workCenterSetupMin ?? '';
  if (r.workCenterRunMin === undefined) r.workCenterRunMin = row.workCenterRunMin ?? '';
  if (r.routingSetupMin === undefined) r.routingSetupMin = row.routingSetupMin ?? '';
  if (r.routingRunMin === undefined) r.routingRunMin = row.routingRunMin ?? '';
  if (r.assemblingTimeMin === undefined) r.assemblingTimeMin = row.assemblingTimeMin ?? '';
  if (r.glueAreaTimeMin === undefined) r.glueAreaTimeMin = row.glueAreaTimeMin ?? '';
  if (r.unitCostTimeMin === undefined) r.unitCostTimeMin = row.unitCostTimeMin ?? '';
  if (r.machineCostTimeMin === undefined) r.machineCostTimeMin = row.machineCostTimeMin ?? '';
  if (r.laborCostTimeMin === undefined) r.laborCostTimeMin = row.laborCostTimeMin ?? '';
  if (r.ketProses === undefined) r.ketProses = row.ketProses ?? '';
  if (r.keterangan === undefined) r.keterangan = row.keterangan ?? '';
  if (r.versiBom === undefined) r.versiBom = row.versiBom ?? '';
  if (r.pusatBiaya === undefined) r.pusatBiaya = row.pusatBiaya ?? '';
  if (r.perawatan === undefined) r.perawatan = row.perawatan ?? '';
  if (r.manufacture === undefined) r.manufacture = row.manufacture ?? (row.procCode ?? '');
  if (r.biayaSatuan === undefined) r.biayaSatuan = row.biayaSatuan ?? '';
  if (r.biayaMesin === undefined) r.biayaMesin = row.biayaMesin ?? '';
  if (r.biayaTenagaKerja === undefined) r.biayaTenagaKerja = row.biayaTenagaKerja ?? '';
  if (r.infoBom === undefined) r.infoBom = row.infoBom ?? '';
  if (r.imageUrl === undefined) r.imageUrl = row.imageUrl ?? '';
  if (r.applyOnVariants === undefined) r.applyOnVariants = row.applyOnVariants ?? false;
  if (r.assembling === undefined) r.assembling = row.assembling ?? '';
  if (r.leadTime === undefined) r.leadTime = row.leadTime ?? '';
  if (r.supplier === undefined) r.supplier = row.supplier ?? '';
  if (r.revision === undefined) r.revision = row.revision ?? '';
  if (r.drawingRef === undefined) r.drawingRef = row.drawingRef ?? '';
  if (!Array.isArray(r.routingSteps)) r.routingSteps = [];
  return r;
}
