import type { BomRow } from '@/types';

function p(v: string | number | undefined): number {
  return parseFloat(String(v ?? '')) || 0;
}

export function calcVolCutting(row: BomRow): string {
  const pv = p(row.dimAP);
  const lv = p(row.dimAL);
  const tv = p(row.dimAT);
  const qty = p(row.qty) || 1;
  if (!pv || !lv || !tv) return '';
  return ((pv * lv * tv * qty) / 1e9).toFixed(4);
}

export function calcVolInvoice(row: BomRow): string {
  const pv = p(row.dimDP || row.dimAP);
  const lv = p(row.dimDL || row.dimAL);
  const tv = p(row.dimDT || row.dimAT);
  const qty = p(row.qty) || 1;
  if (!pv || !lv || !tv) return '';
  return ((pv * lv * tv * qty) / 1e9).toFixed(4);
}

export function calcM2(row: BomRow): string {
  const pv = p(row.dimAP);
  const lv = p(row.dimAL);
  const sisi = p(row.sisiEdging) || p(row.sisiVeneer) || 1;
  if (!pv || !lv) return '';
  return ((pv * lv * sisi) / 1e6).toFixed(4);
}

export function calcManufactureCost(row: BomRow): number {
  const explicitTotal = p((row.totalManufactureCost as string | number | undefined) ?? '');
  if (explicitTotal > 0) return explicitTotal;
  const gaji8Jam = p((row.biayaTenagaKerja as string | number | undefined) ?? '');
  const setupMin = p((row.setupCleanupTime as string | number | undefined) ?? '');
  const workMin = p((row.workingTime as string | number | undefined) ?? '');
  const workerCountRaw = p((row.workerCount as string | number | undefined) ?? '');
  const workerCount = workerCountRaw > 0 ? workerCountRaw : 1;
  const totalMinutes = setupMin + workMin;
  if (gaji8Jam > 0 && totalMinutes > 0) {
    const workerCost = (gaji8Jam / (8 * 60)) * totalMinutes * workerCount;
    return workerCost + p((row.machineCost as string | number | undefined) ?? '');
  }
  return p(row.workCenterCost) + p(row.routingCost);
}

/**
 * Calculate treatment cost (glue, edging, finishing)
 */
export function calcTreatmentCost(row: BomRow): number {
  const explicitSurfaceCost = p(row.surfaceCost);
  const explicitTreatmentCost = p(row.treatmentCost);
  const legacySurfaceCost = p(row.edgingCost) + p(row.finishingCost);
  const surfaceCost = explicitSurfaceCost || legacySurfaceCost;
  return surfaceCost + explicitTreatmentCost;
}

/**
 * Calculate total cost for a row including material, operations and treatments
 * For Part level: biayaSatuan × qty + treatment costs
 * For Module/Submodule: sum of children costs
 * For Operation: worker cost + machine cost
 */
export function calcRowTotalCost(row: BomRow): number {
  const qty = p(row.qty) || 1;
  const scrapPct = p(row.scrapPercent) || 0;
  const qtyActual = qty * (1 + scrapPct / 100);
  
  // Base material/unit cost
  let baseCost = 0;
  if (row.level === 'part') {
    baseCost = p(row.biayaSatuan) * qtyActual;
  }
  
  // Add operation/manufacture cost (manual total or WC+Routing fallback)
  const operationCost = calcManufactureCost(row);
  
  // Add treatment costs
  const treatmentCost = calcTreatmentCost(row);
  
  return baseCost + operationCost + treatmentCost;
}

/**
 * Calculate hierarchical costs - parent costs include all children
 */
export function calcHierarchicalCost(rows: BomRow[], rowId: string): number {
  const row = rows.find((r) => r.id === rowId);
  if (!row) return 0;
  
  // Get direct cost
  const directCost = calcRowTotalCost(row);
  
  // If this is a parent, add children costs
  if (row.level === 'module' || row.level === 'submodule') {
    const children = rows.filter((r) => r.parentId === rowId);
    const childrenCost = children.reduce((sum, child) => sum + calcHierarchicalCost(rows, child.id), 0);
    return directCost + childrenCost;
  }
  
  return directCost;
}

export function recomputeRow(row: BomRow): BomRow {
  const out = { ...row };
  out.volCut = calcVolCutting(out);
  out.volInvoice = calcVolInvoice(out);
  out.m2 = calcM2(out);
  const qty = p(out.qty) || 0;
  const scrapPct = p(out.scrapPercent) || 0;
  const qtyActual = qty * (1 + scrapPct / 100);
  out.qtyActual = qty > 0 ? qtyActual.toFixed(2) : '';

  const mfg = calcManufactureCost(out);
  out.manufactureCost = mfg ? String(mfg) : '';

  return out;
}

export function recalculateAllRows(rows: BomRow[]): BomRow[] {
  return rows.map(recomputeRow);
}

export function computeVolInline(row: BomRow): string {
  const pv = p(row.dimAP);
  const lv = p(row.dimAL);
  const tv = p(row.dimAT);
  const qty = p(row.qty) || 1;
  if (!pv || !lv || !tv) return '';
  return ((pv * lv * tv * qty) / 1e9).toFixed(4);
}

export function computeSummary(bomRows: BomRow[], hardwareRows?: any[], packingRows?: any[]) {
  let totalBiayaSatuan = 0;
  let totalSurfaceCost = 0;
  let totalTreatmentDirectCost = 0;
  let totalMfgCost = 0;
  let totalHardwareCost = 0;
  let totalPackingCost = 0;

  // Aggregate from BOM rows
  bomRows.forEach((r) => {
    const qty = p(r.qty) || 1;
    const scrapPct = p(r.scrapPercent) || 0;
    const qtyActual = qty * (1 + scrapPct / 100);
    
    // Unit cost
    if (r.level === 'part') {
      totalBiayaSatuan += p(r.biayaSatuan) * qtyActual;
    }
    
    // Surface + treatment costs (with legacy fallback)
    const explicitSurface = p(r.surfaceCost);
    const legacySurface = p(r.edgingCost) + p(r.finishingCost);
    totalSurfaceCost += explicitSurface || legacySurface;
    totalTreatmentDirectCost += p(r.treatmentCost) || 0;
    
    // Manufacturing costs (manual total or WC+Routing fallback)
    totalMfgCost += calcManufactureCost(r);
  });

  // Add Hardware costs
  if (hardwareRows && Array.isArray(hardwareRows)) {
    hardwareRows.forEach((hw: any) => {
      const qty = p(hw.qty) || 1;
      const unitCost = p(hw.unitCost) || 0;
      totalHardwareCost += qty * unitCost;
    });
  }

  // Add Packing costs
  if (packingRows && Array.isArray(packingRows)) {
    packingRows.forEach((pk: any) => {
      const qty = p(pk.qty) || 1;
      const unitCost = p(pk.unitCost) || 0;
      totalPackingCost += qty * unitCost;
    });
  }

  const totalTreatment = totalSurfaceCost + totalTreatmentDirectCost;
  const grand = totalBiayaSatuan + totalMfgCost + totalTreatment + totalHardwareCost + totalPackingCost;
  
  return {
    biayaSatuan: totalBiayaSatuan,
    // Compatibility keys kept so old helper/UI code does not crash.
    edgingCost: 0,
    finishingCost: 0,
    surfaceCost: totalSurfaceCost,
    treatmentDirectCost: totalTreatmentDirectCost,
    mfgCost: totalMfgCost,
    treatmentCost: totalTreatment,
    hardwareCost: totalHardwareCost,
    packingCost: totalPackingCost,
    grand,
  };
}
