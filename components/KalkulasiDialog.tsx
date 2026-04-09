'use client';

import { X } from 'lucide-react';
import type { BomRow } from '@/types';
import { calcManufactureCost, computeSummary } from '@/lib/calculations';

interface KalkulasiDialogProps {
  open: boolean;
  onClose: () => void;
  bomRows: BomRow[];
  hardwareRows?: any[];
  packingRows?: any[];
}

function num(v: string | number | undefined): number {
  return parseFloat(String(v ?? '')) || 0;
}

function fmt(n: number): string {
  return n.toLocaleString('id-ID');
}

export function KalkulasiDialog({ open, onClose, bomRows, hardwareRows = [], packingRows = [] }: KalkulasiDialogProps) {
  if (!open) return null;

  const parts = bomRows.filter((r) => r.levelNum === 2);
  const allRows = bomRows;
  const summary = computeSummary(bomRows, hardwareRows, packingRows);

  const summaryItems = [
    { label: 'Biaya Material', value: summary.biayaSatuan, color: 'text-amber-800' },
    { label: 'Biaya Manufacture', value: summary.mfgCost, color: 'text-indigo-800' },
    { label: 'Biaya Surface', value: summary.surfaceCost, color: 'text-cyan-800' },
    { label: 'Biaya Treatment', value: summary.treatmentDirectCost, color: 'text-lime-800' },
    { label: 'Biaya Hardware/Misc', value: summary.hardwareCost, color: 'text-rose-800' },
    { label: 'Biaya Packing', value: summary.packingCost, color: 'text-emerald-800' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" aria-hidden onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-xl bg-white border border-slate-200 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 z-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">View Kalkulasi</h2>
            <p className="text-xs text-slate-500 mt-0.5">Breakdown biaya berdasarkan struktur hierarki BOM</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {summaryItems.map((item) => (
              <div key={item.label} className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <p className="text-[11px] text-slate-500 mb-1">{item.label}</p>
                <p className={`text-lg font-bold tabular-nums ${item.color}`}>Rp {fmt(item.value)}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-sky-50 border border-sky-200 p-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">GRAND TOTAL</span>
            <span className="text-xl font-bold text-sky-800 tabular-nums">Rp {fmt(summary.grand)}</span>
          </div>

          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs">No</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs">Kode</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs">Nama</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs">Qty</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs">Material</th>
                  <th className="text-right py-2 px-3 font-semibold text-indigo-700 text-xs">Manufacture</th>
                  <th className="text-right py-2 px-3 font-semibold text-cyan-700 text-xs">Surface</th>
                  <th className="text-right py-2 px-3 font-semibold text-lime-700 text-xs">Treatment</th>
                  <th className="text-right py-2 px-3 font-semibold text-orange-700 text-xs">Total</th>
                </tr>
              </thead>
              <tbody>
                {allRows.slice(0, 100).map((row) => {
                  const qty = num(row.qty);
                  const scrap = num(row.scrapPercent || '0');
                  const qtyActual = qty * (1 + scrap / 100);
                  const matCost = num(row.biayaSatuan) * qtyActual;
                  const mfgCost = calcManufactureCost(row);
                  const legacySurfaceCost = num(row.edgingCost) + num(row.finishingCost);
                  const surfaceCost = num(row.surfaceCost) || legacySurfaceCost;
                  const treatmentCost = num(row.treatmentCost);
                  const rowTotal = matCost + mfgCost + surfaceCost + treatmentCost;
                  const indent = (row.levelNum ?? 0) * 12;

                  return (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-1.5 px-3 text-slate-500 text-xs">{row.no}</td>
                      <td className="py-1.5 px-3 text-slate-600 text-xs">{row.partCode || '-'}</td>
                      <td className="py-1.5 px-3 text-slate-800 text-xs font-medium" style={{ paddingLeft: 12 + indent }}>
                        {row.description || row.modul || '-'}
                      </td>
                      <td className="py-1.5 px-3 text-right text-slate-600 text-xs tabular-nums">
                        {qtyActual > 0 ? qtyActual.toFixed(2) : '-'}
                      </td>
                      <td className="py-1.5 px-3 text-right text-amber-800 text-xs tabular-nums">{matCost > 0 ? fmt(matCost) : '-'}</td>
                      <td className="py-1.5 px-3 text-right text-indigo-800 text-xs tabular-nums">{mfgCost > 0 ? fmt(mfgCost) : '-'}</td>
                      <td className="py-1.5 px-3 text-right text-cyan-800 text-xs tabular-nums">{surfaceCost > 0 ? fmt(surfaceCost) : '-'}</td>
                      <td className="py-1.5 px-3 text-right text-lime-800 text-xs tabular-nums">{treatmentCost > 0 ? fmt(treatmentCost) : '-'}</td>
                      <td className="py-1.5 px-3 text-right text-orange-800 text-xs tabular-nums font-semibold">{rowTotal > 0 ? fmt(rowTotal) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {allRows.length > 100 && <p className="py-2 px-3 text-xs text-slate-500">Menampilkan 100 dari {allRows.length} baris.</p>}
          </div>

          <div className="flex gap-4 text-xs text-slate-500">
            <span>Total baris: <strong className="text-slate-800">{allRows.length}</strong></span>
            <span>Modul: <strong className="text-slate-800">{allRows.filter((r) => r.levelNum === 0).length}</strong></span>
            <span>Sub Modul: <strong className="text-slate-800">{allRows.filter((r) => r.levelNum === 1).length}</strong></span>
            <span>Part: <strong className="text-slate-800">{parts.length}</strong></span>
            <span>Operation: <strong className="text-slate-800">{allRows.filter((r) => r.levelNum === 3).length}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
