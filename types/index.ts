export interface BomMetadata {
  productCode: string;
  productName: string;
  productDisplay: string;
  reference: string;
  productVariant: string;
  bomType: string;
  productType?: 'Standard' | 'Custom' | 'Export' | 'OEM';
  bomInputMode: 'auto' | 'manual';
  currency: 'IDR' | 'USD';
  barangProduksi: string;
  proses: string;
  versiBom: string;
  defaultVersi?: boolean;
  bomQuantity: string;
  bomUnit: string;
  markupPercent?: string;
  usdRate?: string;
  leadTime?: string;
  effectiveDate?: string;
  expiryDate?: string;
  customer: string;
  buyerCode: string;
  company: string;
  itemType: string;
  wood: string;
  coatingColor: string;
  itemDim: string;
  itemWidth: string;
  itemDepth: string;
  itemHeight: string;
  volM3: string;
  [key: string]: unknown;
}

export interface BomRow {
  id: string;
  level: 'module' | 'submodule' | 'part' | 'operation';
  levelNum: number;
  parentId: string | null;
  expanded?: boolean;
  no: number;
  mod: string;
  subMod: string;
  partCode: string;
  modul: string;
  description: string;
  unit: string;
  material: string;
  kodeMat: string;
  jenis: string;
  grade: string;
  workCenterOrRouting: string;
  workCenterSetupMin: string;
  workCenterRunMin: string;
  routingSetupMin: string;
  routingRunMin: string;
  processName?: string;
  processType?: string;
  workerSalaryType?: string;
  workerCount?: string;
  setupCleanupTime?: string;
  workingTime?: string;
  manufacturingUnit?: string;
  machineUsage?: string;
  machineCost?: string;
  totalManufactureCost?: string;
  manufacturingNotes?: string;
  assembling: string;
  assemblingTimeMin: string;
  glueArea: string;
  glueAreaTimeMin: string;
  surface?: string;
  surfaceCost?: string;
  edging: string;
  edgingTimeMin: string;
  edgingCost: string;
  sisiEdging: string;
  finishing: string;
  finishingTimeMin: string;
  finishingCost: string;
  sisiVeneer: string;
  treatment: string;
  treatmentCost?: string;
  imageUrl: string;
  routingName: string;
  workCenterCost: string;
  routingCost: string;
  manufactureCost: string;
  keterangan: string;
  pusatBiaya: string;
  biayaSatuan: string;
  biayaMesin: string;
  biayaTenagaKerja: string;
  unitCostTimeMin: string;
  machineCostTimeMin: string;
  laborCostTimeMin: string;
  leadTime: string;
  supplier: string;
  revision: string;
  drawingRef: string;
  wbs: string;
  dimAP: string;
  dimAL: string;
  dimAT: string;
  volCut: string;
  volInvoice: string;
  m2: string;
  qty: string;
  scrapPercent?: string;
  qtyActual?: string;
  routingSteps: unknown[];
  dimBP: string;
  dimBL: string;
  dimBT: string;
  dimCP: string;
  dimCL: string;
  dimCT: string;
  dimDP: string;
  dimDL: string;
  dimDT: string;
  [key: string]: unknown;
}

export interface HardwareRow {
  id: string;
  no: number;
  partCode: string;
  description: string;
  material: string;
  jenisHardware: string;
  qty: string;
  unit?: string;
  unitCost?: string;
  totalCost?: string;
  supplier?: string;
  keterangan: string;
}

export interface Operation {
  id: string;
  no: number;
  name: string;
  manufacture?: string;
  workCenter: string;
  routing: string;
  setupMin: string;
  runMin: string;
  costPerHour: string;
  totalCost: string;
  linkedComponentIds: string[];
  processMode?: 'manual' | 'erp';
  salaryMode?: 'manual' | 'erp';
  salaryManualRate?: string;
  salaryTypeErp?: string;
  peopleCount?: string;
  durationMin?: string;
}

export interface PackingRow {
  id: string;
  no: number;
  partCode: string;
  description: string;
  category: 'inner' | 'outer' | 'protection' | 'label' | 'accessory';
  material: string;
  dimP: string;
  dimL: string;
  dimT: string;
  qty: string;
  unit: string;
  unitCost: string;
  totalCost: string;
  weight: string;
  keterangan: string;
}

export interface PackingInfo {
  outerBoxP: string;
  outerBoxL: string;
  outerBoxT: string;
  outerBoxVolM3: string;
  grossWeight: string;
  netWeight: string;
  packingMethod: string;
  loadPerContainer20: string;
  loadPerContainer40: string;
  packingCostTotal: string;
}

export interface CatalogItem {
  code: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  material: string;
}

export interface MasterModul {
  id: string;
  name: string;
  code?: string;
  description?: string;
  createdAt: string;
  usageCount: number;
}

export interface MasterSubModul {
  id: string;
  modulId: string;
  name: string;
  code?: string;
  description?: string;
  createdAt: string;
  usageCount: number;
}

export interface MasterMaterial {
  id: string;
  name: string;
  code?: string;
  jenis?: string;
  grade?: string;
  supplier?: string;
  unitCost?: string;
  description?: string;
  createdAt: string;
  usageCount: number;
}

export interface MasterData {
  moduls: MasterModul[];
  submoduls: MasterSubModul[];
  materials: MasterMaterial[];
}
