import type { BomRow } from '@/types';

export function levelToNum(level: string): number {
  if (level === 'module') return 0;
  if (level === 'submodule') return 1;
  return 2;
}

export function normalizeBomRow(row: Partial<BomRow> & { id: string }): BomRow {
  const r = { ...row } as Record<string, unknown>;
  const toNum = (value: unknown): number => Number.parseFloat(String(value ?? 0)) || 0;
  if (!r.id) r.id = '';
  if (r.levelNum == null) r.levelNum = levelToNum((r.level as string) || 'part');
  if (r.parentId === undefined) r.parentId = (row.parentId ?? null) as string | null;
  if (r.expanded === undefined) r.expanded = true;
  if (r.unit === undefined || r.unit === '') r.unit = (row.unit as string) ?? 'EA';
  r.workCenterOrRouting = r.workCenterOrRouting ?? '';
  r.workCenterSetupMin = r.workCenterSetupMin ?? '';
  r.workCenterRunMin = r.workCenterRunMin ?? '';
  r.routingSetupMin = r.routingSetupMin ?? '';
  r.routingRunMin = r.routingRunMin ?? '';
  r.processName = r.processName ?? '';
  r.processType = r.processType ?? '';
  r.workerSalaryType = r.workerSalaryType ?? '';
  r.workerCount = r.workerCount ?? '';
  r.setupCleanupTime = r.setupCleanupTime ?? '';
  r.workingTime = r.workingTime ?? '';
  r.manufacturingUnit = r.manufacturingUnit ?? '';
  r.machineUsage = r.machineUsage ?? '';
  r.machineCost = r.machineCost ?? '';
  r.totalManufactureCost = r.totalManufactureCost ?? '';
  r.manufacturingNotes = r.manufacturingNotes ?? '';
  r.assemblingTimeMin = r.assemblingTimeMin ?? '';
  r.glueAreaTimeMin = r.glueAreaTimeMin ?? '';
  r.surface = (r.surface as string | undefined) ?? '';
  // Preserve legacy finishing/edging cost as surface cost when opening older rows.
  if (r.surfaceCost == null || r.surfaceCost === '') {
    const legacySurfaceCost = toNum(r.edgingCost) + toNum(r.finishingCost);
    r.surfaceCost = legacySurfaceCost > 0 ? String(legacySurfaceCost) : '';
  }
  r.edging = r.edging ?? '';
  r.edgingTimeMin = r.edgingTimeMin ?? '';
  r.edgingCost = r.edgingCost ?? '';
  r.sisiEdging = r.sisiEdging ?? '';
  r.finishing = r.finishing ?? '';
  r.finishingTimeMin = r.finishingTimeMin ?? '';
  r.finishingCost = r.finishingCost ?? '';
  r.sisiVeneer = r.sisiVeneer ?? '';
  if ((r.surface as string) === '') {
    r.surface = String(r.finishing || r.edging || '');
  }
  r.treatment = r.treatment ?? '';
  r.treatmentCost = r.treatmentCost ?? '';
  r.imageUrl = r.imageUrl ?? '';
  r.routingName = r.routingName ?? '';
  r.workCenterCost = r.workCenterCost ?? '';
  r.routingCost = r.routingCost ?? '';
  r.manufactureCost = r.manufactureCost ?? '';
  r.unitCostTimeMin = r.unitCostTimeMin ?? '';
  r.machineCostTimeMin = r.machineCostTimeMin ?? '';
  r.laborCostTimeMin = r.laborCostTimeMin ?? '';
  r.keterangan = r.keterangan ?? '';
  r.pusatBiaya = r.pusatBiaya ?? '';
  r.biayaSatuan = r.biayaSatuan ?? '';
  r.biayaMesin = r.biayaMesin ?? '';
  r.biayaTenagaKerja = r.biayaTenagaKerja ?? '';
  r.leadTime = r.leadTime ?? '';
  r.supplier = r.supplier ?? '';
  r.revision = r.revision ?? '';
  r.drawingRef = r.drawingRef ?? '';
  r.wbs = r.wbs ?? '';
  r.jenis = r.jenis ?? '';
  r.grade = r.grade ?? '';
  r.dimAP = r.dimAP ?? '';
  r.dimAL = r.dimAL ?? '';
  r.dimAT = r.dimAT ?? '';
  r.dimBP = r.dimBP ?? '';
  r.dimBL = r.dimBL ?? '';
  r.dimBT = r.dimBT ?? '';
  r.dimCP = r.dimCP ?? '';
  r.dimCL = r.dimCL ?? '';
  r.dimCT = r.dimCT ?? '';
  r.dimDP = r.dimDP ?? '';
  r.dimDL = r.dimDL ?? '';
  r.dimDT = r.dimDT ?? '';
  r.volCut = r.volCut ?? '';
  r.volInvoice = r.volInvoice ?? '';
  r.m2 = r.m2 ?? '';
  r.qty = r.qty ?? '';
  if (!Array.isArray(r.routingSteps)) r.routingSteps = [];
  return r as BomRow;
}
