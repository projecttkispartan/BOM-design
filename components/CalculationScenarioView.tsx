'use client';

import { useMemo } from 'react';
import { Calculator, Layers3, Package, Settings2, Sigma } from 'lucide-react';
import type { BomMetadata, BomRow, HardwareRow, PackingRow } from '@/types';
import { calcManufactureCost, computeSummary } from '@/lib/calculations';

interface CalculationScenarioViewProps {
  metadata: BomMetadata;
  bomRows: BomRow[];
  hardwareRows?: HardwareRow[];
  packingRows?: PackingRow[];
}

interface ScenarioRow {
  row: BomRow;
  path: string;
  qtyActual: number;
  materialCost: number;
  mfgCost: number;
  surfaceCost: number;
  treatmentCost: number;
  subtotal: number;
  materialFormula: string;
  mfgFormula: string;
  surfaceFormula: string;
}

function num(value: string | number | undefined): number {
  return Number.parseFloat(String(value ?? '')) || 0;
}

function fmtNumber(value: number, digits = 2): string {
  return value.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function fmtMoney(value: number, currency: string): string {
  const normalized = currency === 'USD' ? 'USD' : 'IDR';
  const locale = normalized === 'USD' ? 'en-US' : 'id-ID';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalized,
    maximumFractionDigits: normalized === 'USD' ? 2 : 0,
  }).format(value);
}

function rowTitle(row: BomRow): string {
  return row.description || row.modul || row.partCode || `Baris ${row.no}`;
}

function buildPath(row: BomRow, rowById: Map<string, BomRow>): string {
  const chunks: string[] = [rowTitle(row)];
  let parentId = row.parentId;
  while (parentId) {
    const parent = rowById.get(parentId);
    if (!parent) break;
    chunks.unshift(rowTitle(parent));
    parentId = parent.parentId;
  }
  return chunks.join(' / ');
}

function belongsToModule(row: BomRow, moduleId: string, rowById: Map<string, BomRow>): boolean {
  let current: BomRow | undefined = row;
  while (current) {
    if (current.id === moduleId) return true;
    current = current.parentId ? rowById.get(current.parentId) : undefined;
  }
  return false;
}

function getManufactureFormula(row: BomRow, currency: string): string {
  const explicitTotal = num(row.totalManufactureCost);
  if (explicitTotal > 0) return `Manual total = ${fmtMoney(explicitTotal, currency)}`;

  const salary8h = num(row.biayaTenagaKerja);
  const setup = num(row.setupCleanupTime);
  const work = num(row.workingTime);
  const workerRaw = num(row.workerCount);
  const workerCount = workerRaw > 0 ? workerRaw : 1;
  const machineCost = num(row.machineCost);
  const minutes = setup + work;

  if (salary8h > 0 && minutes > 0) {
    return `(${fmtNumber(salary8h, 0)}/480 x ${fmtNumber(minutes, 0)} x ${fmtNumber(workerCount, 0)}) + ${fmtNumber(machineCost, 0)}`;
  }

  const wcCost = num(row.workCenterCost);
  const rtCost = num(row.routingCost);
  if (wcCost > 0 || rtCost > 0) return `WC ${fmtNumber(wcCost, 0)} + Routing ${fmtNumber(rtCost, 0)}`;

  return '-';
}

export function CalculationScenarioView({
  metadata,
  bomRows,
  hardwareRows = [],
  packingRows = [],
}: CalculationScenarioViewProps) {
  const rowById = useMemo(() => new Map(bomRows.map((row) => [row.id, row])), [bomRows]);
  const summary = useMemo(() => computeSummary(bomRows, hardwareRows, packingRows), [bomRows, hardwareRows, packingRows]);
  const currency = metadata.currency ?? 'IDR';
  const usdRate = num(metadata.usdRate) > 0 ? num(metadata.usdRate) : 16000;
  const markupPercent = num(metadata.markupPercent);
  const grandAfterMarkup = summary.grand * (1 + markupPercent / 100);

  const scenarioRows = useMemo<ScenarioRow[]>(
    () =>
      bomRows.map((row) => {
        const qty = num(row.qty);
        const scrap = num(row.scrapPercent);
        const qtyActual = qty > 0 ? qty * (1 + scrap / 100) : 0;
        const isPart = row.level === 'part' || row.levelNum === 2;
        const materialCost = isPart ? num(row.biayaSatuan) * qtyActual : 0;
        const mfgCost = calcManufactureCost(row);
        const legacySurface = num(row.edgingCost) + num(row.finishingCost);
        const surfaceCost = num(row.surfaceCost) || legacySurface;
        const treatmentCost = num(row.treatmentCost);
        const subtotal = materialCost + mfgCost + surfaceCost + treatmentCost;
        const materialFormula = isPart
          ? `${fmtNumber(num(row.biayaSatuan), 0)} x ${fmtNumber(qtyActual)}`
          : '-';

        return {
          row,
          path: buildPath(row, rowById),
          qtyActual,
          materialCost,
          mfgCost,
          surfaceCost,
          treatmentCost,
          subtotal,
          materialFormula,
          mfgFormula: getManufactureFormula(row, currency),
          surfaceFormula: `${fmtNumber(surfaceCost, 0)} + ${fmtNumber(treatmentCost, 0)}`,
        };
      }),
    [bomRows, currency, rowById],
  );

  const moduleCards = useMemo(() => {
    const moduleRows = bomRows.filter((row) => row.level === 'module' || row.levelNum === 0);
    return moduleRows.map((moduleRow) => {
      const linkedRows = scenarioRows.filter((item) => belongsToModule(item.row, moduleRow.id, rowById));
      const material = linkedRows.reduce((sum, item) => sum + item.materialCost, 0);
      const mfg = linkedRows.reduce((sum, item) => sum + item.mfgCost, 0);
      const surface = linkedRows.reduce((sum, item) => sum + item.surfaceCost, 0);
      const treatment = linkedRows.reduce((sum, item) => sum + item.treatmentCost, 0);
      const subtotal = linkedRows.reduce((sum, item) => sum + item.subtotal, 0);
      return {
        module: moduleRow,
        rows: linkedRows.length,
        material,
        mfg,
        surface,
        treatment,
        subtotal,
      };
    });
  }, [bomRows, rowById, scenarioRows]);

  const submoduleCount = bomRows.filter((row) => row.level === 'submodule' || row.levelNum === 1).length;
  const partCount = bomRows.filter((row) => row.level === 'part' || row.levelNum === 2).length;
  const operationCount = bomRows.filter((row) => row.level === 'operation' || row.levelNum === 3).length;

  return (
    <div className="scrollbar-visible h-full overflow-y-auto p-4">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Skenario Kalkulasi End-to-End</h3>
              <p className="mt-1 text-xs text-slate-600">
                Tampilan ini menjelaskan alur biaya dari struktur modul hingga menjadi hasil akhir.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-blue-700">Modul</div>
            <div className="text-lg font-bold text-blue-900">{moduleCards.length}</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Sub Modul</div>
            <div className="text-lg font-bold text-emerald-900">{submoduleCount}</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700">Part</div>
            <div className="text-lg font-bold text-amber-900">{partCount}</div>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-violet-700">Operation</div>
            <div className="text-lg font-bold text-violet-900">{operationCount}</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-slate-700" />
            <h4 className="text-sm font-semibold text-slate-900">View Modul Baru</h4>
          </div>
          {moduleCards.length === 0 ? (
            <p className="text-xs text-slate-500">Belum ada modul. Tambahkan modul untuk melihat skenario per modul.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {moduleCards.map((item) => (
                <div key={item.module.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">{rowTitle(item.module)}</div>
                    <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {item.rows} baris
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded border border-amber-200 bg-amber-50 px-2 py-1">
                      <div className="text-amber-700">Material</div>
                      <div className="font-semibold text-amber-900">{fmtMoney(item.material, currency)}</div>
                    </div>
                    <div className="rounded border border-indigo-200 bg-indigo-50 px-2 py-1">
                      <div className="text-indigo-700">Manufacture</div>
                      <div className="font-semibold text-indigo-900">{fmtMoney(item.mfg, currency)}</div>
                    </div>
                    <div className="rounded border border-cyan-200 bg-cyan-50 px-2 py-1">
                      <div className="text-cyan-700">Surface</div>
                      <div className="font-semibold text-cyan-900">{fmtMoney(item.surface, currency)}</div>
                    </div>
                    <div className="rounded border border-lime-200 bg-lime-50 px-2 py-1">
                      <div className="text-lime-700">Treatment</div>
                      <div className="font-semibold text-lime-900">{fmtMoney(item.treatment, currency)}</div>
                    </div>
                  </div>
                  <div className="mt-2 rounded border border-sky-200 bg-sky-50 px-2 py-1.5 text-xs">
                    <div className="text-sky-700">Subtotal Modul</div>
                    <div className="font-bold text-sky-900">{fmtMoney(item.subtotal, currency)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
            <Settings2 className="h-4 w-4 text-slate-700" />
            <h4 className="text-sm font-semibold text-slate-900">Alur Formula per Baris</h4>
          </div>
          <div className="scrollbar-visible overflow-x-auto">
            <table className="min-w-[1200px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">No</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Hirarki</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Formula Material</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Formula Manufacture</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Formula Surface + Treatment</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {scenarioRows.map((item) => (
                  <tr key={item.row.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-500">{item.row.no}</td>
                    <td className="px-3 py-2 text-slate-800">{item.path}</td>
                    <td className="px-3 py-2 text-slate-600">{item.materialFormula}</td>
                    <td className="px-3 py-2 text-slate-600">{item.mfgFormula}</td>
                    <td className="px-3 py-2 text-slate-600">{item.surfaceFormula}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">{fmtMoney(item.subtotal, currency)}</td>
                  </tr>
                ))}
                {scenarioRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                      Belum ada data untuk dihitung.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Sigma className="h-4 w-4 text-slate-700" />
            <h4 className="text-sm font-semibold text-slate-900">Hasil Akhir Skenario</h4>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-amber-700">Biaya Material</div>
              <div className="font-bold text-amber-900">{fmtMoney(summary.biayaSatuan, currency)}</div>
            </div>
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-indigo-700">Biaya Manufacture</div>
              <div className="font-bold text-indigo-900">{fmtMoney(summary.mfgCost, currency)}</div>
            </div>
            <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-cyan-700">Biaya Surface + Treatment</div>
              <div className="font-bold text-cyan-900">{fmtMoney(summary.treatmentCost, currency)}</div>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-rose-700">Biaya Hardware/Misc</div>
              <div className="font-bold text-rose-900">{fmtMoney(summary.hardwareCost, currency)}</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-emerald-700">Biaya Packing</div>
              <div className="font-bold text-emerald-900">{fmtMoney(summary.packingCost, currency)}</div>
            </div>
            <div className="rounded-lg border border-slate-300 bg-slate-50 p-3">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-slate-700">Markup</div>
              <div className="font-bold text-slate-900">{fmtNumber(markupPercent)}%</div>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Package className="h-4 w-4 text-sky-700" />
                Grand Total
              </div>
              <div className="text-lg font-bold text-sky-900">{fmtMoney(summary.grand, currency)}</div>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Formula: Material + Manufacture + Surface/Treatment + Hardware + Packing
            </p>
          </div>

          <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-emerald-900">Hasil Setelah Markup</div>
              <div className="text-lg font-bold text-emerald-900">{fmtMoney(grandAfterMarkup, currency)}</div>
            </div>
            {currency === 'USD' && (
              <p className="mt-1 text-xs text-emerald-800">
                Konversi IDR (kurs {fmtNumber(usdRate, 0)}): {fmtMoney(grandAfterMarkup * usdRate, 'IDR')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

