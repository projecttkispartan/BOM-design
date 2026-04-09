import type { CatalogItem } from '@/types';

export const CATALOG_ITEMS: CatalogItem[] = [
  { code: 'PNL-001', name: 'Papan LVLK 18mm', category: 'Material Kayu', price: 185000, unit: 'lembar', material: 'KAYU SOLID' },
  { code: 'MDF-012', name: 'Papan MDF 12mm', category: 'Material Kayu', price: 95000, unit: 'lembar', material: 'MDF' },
  { code: 'MDF-018', name: 'Papan MDF 18mm', category: 'Material Kayu', price: 125000, unit: 'lembar', material: 'MDF' },
  { code: 'PLY-009', name: 'Plywood 9mm', category: 'Material Kayu', price: 85000, unit: 'lembar', material: 'PLYWOOD' },
  { code: 'PLY-012', name: 'Plywood 12mm', category: 'Material Kayu', price: 105000, unit: 'lembar', material: 'PLYWOOD' },
  { code: 'PLY-018', name: 'Plywood 18mm', category: 'Material Kayu', price: 140000, unit: 'lembar', material: 'PLYWOOD' },
  { code: 'PTC-001', name: 'Particle Board 18mm', category: 'Material Kayu', price: 75000, unit: 'lembar', material: 'PARTICLE BOARD' },
  { code: 'PVC-02', name: 'PVC Edge 2mm', category: 'Finishing', price: 12000, unit: 'meter', material: 'PVC' },
  { code: 'PVC-05', name: 'PVC Edge 0.5mm', category: 'Finishing', price: 8000, unit: 'meter', material: 'PVC' },
  { code: 'LAC-001', name: 'Lacquer Natural', category: 'Finishing', price: 45000, unit: 'liter', material: 'LACQUER' },
  { code: 'LAC-002', name: 'Lacquer Doff', category: 'Finishing', price: 48000, unit: 'liter', material: 'LACQUER' },
  { code: 'STN-OAK', name: 'Stain Oak', category: 'Finishing', price: 35000, unit: 'liter', material: 'STAIN' },
  { code: 'STN-WAL', name: 'Stain Walnut', category: 'Finishing', price: 38000, unit: 'liter', material: 'STAIN' },
  { code: 'GLU-PVA', name: 'Lem PVA Kayu', category: 'Finishing', price: 25000, unit: 'kg', material: 'LEM' },
  { code: 'SND-120', name: 'Amplas P120', category: 'Finishing', price: 5000, unit: 'lembar', material: 'ABRASIVE' },
  { code: 'SND-180', name: 'Amplas P180', category: 'Finishing', price: 5500, unit: 'lembar', material: 'ABRASIVE' },
  { code: 'HV-35', name: 'Engsel 35mm', category: 'Hardware', price: 15000, unit: 'pcs', material: 'HARDWARE' },
  { code: 'SCR-640', name: 'Screw 6x40', category: 'Hardware', price: 2500, unit: 'pcs', material: 'HARDWARE' },
  { code: 'BLT-M6', name: 'Bolt M6x50', category: 'Hardware', price: 3500, unit: 'pcs', material: 'HARDWARE' },
  { code: 'DWL-8', name: 'Dowel 8mm', category: 'Hardware', price: 1500, unit: 'pcs', material: 'HARDWARE' },
  { code: 'CAM-15', name: 'Cam Lock 15mm', category: 'Hardware', price: 8000, unit: 'pcs', material: 'HARDWARE' },
  { code: 'SLD-450', name: 'Slide Rail 450mm', category: 'Hardware', price: 45000, unit: 'pair', material: 'HARDWARE' },
];

export const CATALOG_CATEGORIES = ['Semua', 'Material Kayu', 'Finishing', 'Hardware'];
