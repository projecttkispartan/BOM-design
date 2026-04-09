'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Package, Box, ShieldCheck, Tag, Wrench, ChevronDown } from 'lucide-react';
import type { PackingRow, PackingInfo } from '@/types';

const CATEGORY_OPTIONS: { value: PackingRow['category']; label: string; icon: typeof Package }[] = [
  { value: 'outer', label: 'Outer Box', icon: Box },
  { value: 'inner', label: 'Inner Box', icon: Package },
  { value: 'protection', label: 'Protection', icon: ShieldCheck },
  { value: 'label', label: 'Label / Sticker', icon: Tag },
  { value: 'accessory', label: 'Accessory', icon: Wrench },
];

const CATEGORY_COLORS: Record<string, string> = {
  outer: 'bg-amber-100 text-amber-900 border border-amber-200',
  inner: 'bg-sky-100 text-sky-900 border border-sky-200',
  protection: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
  label: 'bg-purple-100 text-purple-900 border border-purple-200',
  accessory: 'bg-rose-100 text-rose-900 border border-rose-200',
};

const PACKING_METHOD_OPTIONS = ['Carton Box', 'Wooden Crate', 'Pallet', 'Bubble Wrap + Stretch Film', 'Custom'];

function genId(): string {
  return 'pk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function p(v: string | number | undefined): number {
  if (v === undefined || v === '') return 0;
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

function fmtRp(v: number): string {
  if (!v) return '—';
  return 'Rp ' + v.toLocaleString('id-ID');
}

interface PackingTableProps {
  packingRows: PackingRow[];
  packingInfo: PackingInfo;
  onUpdateRows: (rows: PackingRow[]) => void;
  onUpdateInfo: (info: Partial<PackingInfo>) => void;
  isReadOnly?: boolean;
}

export function PackingTable({ packingRows, packingInfo, onUpdateRows, onUpdateInfo, isReadOnly }: PackingTableProps) {
  const [expandedInfo, setExpandedInfo] = useState(true);

  const handleAdd = useCallback((category: PackingRow['category'] = 'outer') => {
    const newRow: PackingRow = {
      id: genId(),
      no: packingRows.length + 1,
      partCode: '',
      description: '',
      category,
      material: '',
      dimP: '',
      dimL: '',
      dimT: '',
      qty: '1',
      unit: 'PCS',
      unitCost: '',
      totalCost: '',
      weight: '',
      keterangan: '',
    };
    onUpdateRows([...packingRows, newRow]);
  }, [packingRows, onUpdateRows]);

  const handleRemove = useCallback((id: string) => {
    const updated = packingRows.filter((r) => r.id !== id).map((r, i) => ({ ...r, no: i + 1 }));
    onUpdateRows(updated);
  }, [packingRows, onUpdateRows]);

  const handleUpdate = useCallback((id: string, field: keyof PackingRow, value: string) => {
    const updated = packingRows.map((r) => {
      if (r.id !== id) return r;
      const row = { ...r, [field]: value };
      row.totalCost = String(p(row.unitCost) * p(row.qty));
      return row;
    });
    onUpdateRows(updated);
  }, [packingRows, onUpdateRows]);

  const outerBoxVol = useMemo(() => {
    const pV = p(packingInfo.outerBoxP);
    const lV = p(packingInfo.outerBoxL);
    const tV = p(packingInfo.outerBoxT);
    if (pV && lV && tV) return ((pV * lV * tV) / 1_000_000_000).toFixed(4);
    return '';
  }, [packingInfo.outerBoxP, packingInfo.outerBoxL, packingInfo.outerBoxT]);

  const totalPackingCost = useMemo(() => {
    return packingRows.reduce((sum, r) => sum + p(r.totalCost), 0);
  }, [packingRows]);

  const totalWeight = useMemo(() => {
    return packingRows.reduce((sum, r) => sum + p(r.weight) * p(r.qty), 0);
  }, [packingRows]);

  const categoryGroups = useMemo(() => {
    const groups: Record<string, PackingRow[]> = {};
    packingRows.forEach((r) => {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    });
    return groups;
  }, [packingRows]);

  const INPUT_CLS = 'w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors';
  const TH_CLS = 'px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider';
  const TD_CLS = 'px-3 py-2';

  return (
    <div className="space-y-6 p-6">
      {/* Packing Information Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setExpandedInfo(!expandedInfo)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center border border-amber-200">
              <Box className="w-4 h-4 text-amber-800" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-slate-900">Informasi Kemasan</h3>
              <p className="text-xs text-slate-500">Dimensi outer box, berat, metode packing</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedInfo ? 'rotate-180' : ''}`} />
        </button>

        {expandedInfo && (
          <div className="px-5 pb-5 border-t border-slate-100">
            <div className="grid grid-cols-12 gap-4 mt-4">
              {/* Outer Box Dimensions */}
              <div className="col-span-12 lg:col-span-6">
                <label className="block text-xs font-medium text-slate-600 mb-2">Dimensi Outer Box (mm)</label>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="P" value={packingInfo.outerBoxP} onChange={(e) => onUpdateInfo({ outerBoxP: e.target.value })} className={INPUT_CLS} disabled={isReadOnly} />
                  <span className="text-slate-400">×</span>
                  <input type="number" placeholder="L" value={packingInfo.outerBoxL} onChange={(e) => onUpdateInfo({ outerBoxL: e.target.value })} className={INPUT_CLS} disabled={isReadOnly} />
                  <span className="text-slate-400">×</span>
                  <input type="number" placeholder="T" value={packingInfo.outerBoxT} onChange={(e) => onUpdateInfo({ outerBoxT: e.target.value })} className={INPUT_CLS} disabled={isReadOnly} />
                </div>
                {outerBoxVol && (
                  <p className="text-xs text-sky-700 mt-1.5 font-medium">Volume: {outerBoxVol} m³</p>
                )}
              </div>

              {/* Weight */}
              <div className="col-span-6 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-2">Gross Weight (kg)</label>
                <input type="number" placeholder="0.00" value={packingInfo.grossWeight} onChange={(e) => onUpdateInfo({ grossWeight: e.target.value })} className={INPUT_CLS} disabled={isReadOnly} />
              </div>
              <div className="col-span-6 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-2">Net Weight (kg)</label>
                <input type="number" placeholder="0.00" value={packingInfo.netWeight} onChange={(e) => onUpdateInfo({ netWeight: e.target.value })} className={INPUT_CLS} disabled={isReadOnly} />
              </div>

              {/* Packing Method */}
              <div className="col-span-12 lg:col-span-4">
                <label className="block text-xs font-medium text-slate-600 mb-2">Metode Packing</label>
                <select value={packingInfo.packingMethod} onChange={(e) => onUpdateInfo({ packingMethod: e.target.value })} className={INPUT_CLS} disabled={isReadOnly}>
                  {PACKING_METHOD_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Container Loading */}
              <div className="col-span-6 lg:col-span-4">
                <label className="block text-xs font-medium text-slate-600 mb-2">Muat Container 20&apos;</label>
                <input type="number" placeholder="0" value={packingInfo.loadPerContainer20} onChange={(e) => onUpdateInfo({ loadPerContainer20: e.target.value })} className={INPUT_CLS} disabled={isReadOnly} />
              </div>
              <div className="col-span-6 lg:col-span-4">
                <label className="block text-xs font-medium text-slate-600 mb-2">Muat Container 40&apos;</label>
                <input type="number" placeholder="0" value={packingInfo.loadPerContainer40} onChange={(e) => onUpdateInfo({ loadPerContainer40: e.target.value })} className={INPUT_CLS} disabled={isReadOnly} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Packing Materials Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center border border-sky-200">
              <Package className="w-4 h-4 text-sky-800" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Material Packing</h3>
              <p className="text-xs text-slate-500">{packingRows.length} item · Total: {fmtRp(totalPackingCost)} · Berat: {totalWeight.toFixed(2)} kg</p>
            </div>
          </div>
          {!isReadOnly && (
            <div className="flex items-center gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleAdd(cat.value)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${CATEGORY_COLORS[cat.value]} hover:opacity-80 transition-opacity`}
                  title={`Tambah ${cat.label}`}
                >
                  <Plus className="w-3 h-3" />
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto scrollbar-visible">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className={`${TH_CLS} w-12`}>NO</th>
                <th className={`${TH_CLS} w-28`}>KATEGORI</th>
                <th className={`${TH_CLS} w-32`}>KODE</th>
                <th className={`${TH_CLS} min-w-[180px]`}>DESKRIPSI</th>
                <th className={`${TH_CLS} w-28`}>MATERIAL</th>
                <th className={`${TH_CLS} w-20`} title="Panjang">P</th>
                <th className={`${TH_CLS} w-20`} title="Lebar">L</th>
                <th className={`${TH_CLS} w-20`} title="Tinggi">T</th>
                <th className={`${TH_CLS} w-16`}>QTY</th>
                <th className={`${TH_CLS} w-16`}>UNIT</th>
                <th className={`${TH_CLS} w-28`}>BIAYA/UNIT</th>
                <th className={`${TH_CLS} w-28`}>TOTAL</th>
                <th className={`${TH_CLS} w-20`}>BERAT (kg)</th>
                <th className={`${TH_CLS} min-w-[120px]`}>KETERANGAN</th>
                {!isReadOnly && <th className={`${TH_CLS} w-12`} />}
              </tr>
            </thead>
            <tbody>
              {packingRows.length === 0 && (
                <tr>
                  <td colSpan={isReadOnly ? 14 : 15} className="px-5 py-12 text-center">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Belum ada material packing</p>
                    {!isReadOnly && <p className="text-xs text-slate-400 mt-1">Klik tombol di atas untuk menambahkan</p>}
                  </td>
                </tr>
              )}
              {packingRows.map((row) => {
                const catConfig = CATEGORY_OPTIONS.find((c) => c.value === row.category);
                const CatIcon = catConfig?.icon ?? Package;
                const computedTotal = p(row.unitCost) * p(row.qty);
                return (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
                    <td className={`${TD_CLS} text-center text-xs text-slate-500`}>{row.no}</td>
                    <td className={TD_CLS}>
                      {isReadOnly ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[row.category] || ''}`}>
                          <CatIcon className="w-3 h-3" />
                          {catConfig?.label}
                        </span>
                      ) : (
                        <select
                          value={row.category}
                          onChange={(e) => handleUpdate(row.id, 'category', e.target.value)}
                          className={`${INPUT_CLS} text-xs`}
                        >
                          {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      )}
                    </td>
                    <td className={TD_CLS}><input value={row.partCode} onChange={(e) => handleUpdate(row.id, 'partCode', e.target.value)} className={INPUT_CLS} placeholder="PKG-001" disabled={isReadOnly} /></td>
                    <td className={TD_CLS}><input value={row.description} onChange={(e) => handleUpdate(row.id, 'description', e.target.value)} className={INPUT_CLS} placeholder="Kardus luar" disabled={isReadOnly} /></td>
                    <td className={TD_CLS}><input value={row.material} onChange={(e) => handleUpdate(row.id, 'material', e.target.value)} className={INPUT_CLS} placeholder="Karton" disabled={isReadOnly} /></td>
                    <td className={TD_CLS}><input type="number" value={row.dimP} onChange={(e) => handleUpdate(row.id, 'dimP', e.target.value)} className={`${INPUT_CLS} text-center`} placeholder="0" disabled={isReadOnly} /></td>
                    <td className={TD_CLS}><input type="number" value={row.dimL} onChange={(e) => handleUpdate(row.id, 'dimL', e.target.value)} className={`${INPUT_CLS} text-center`} placeholder="0" disabled={isReadOnly} /></td>
                    <td className={TD_CLS}><input type="number" value={row.dimT} onChange={(e) => handleUpdate(row.id, 'dimT', e.target.value)} className={`${INPUT_CLS} text-center`} placeholder="0" disabled={isReadOnly} /></td>
                    <td className={TD_CLS}><input type="number" min={1} value={row.qty} onChange={(e) => handleUpdate(row.id, 'qty', e.target.value)} className={`${INPUT_CLS} text-center`} disabled={isReadOnly} /></td>
                    <td className={TD_CLS}><input value={row.unit} onChange={(e) => handleUpdate(row.id, 'unit', e.target.value)} className={`${INPUT_CLS} text-center`} placeholder="PCS" disabled={isReadOnly} /></td>
                    <td className={TD_CLS}><input type="number" value={row.unitCost} onChange={(e) => handleUpdate(row.id, 'unitCost', e.target.value)} className={INPUT_CLS} placeholder="0" disabled={isReadOnly} /></td>
                    <td className={`${TD_CLS} text-sm font-medium ${computedTotal > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>{computedTotal > 0 ? fmtRp(computedTotal) : '—'}</td>
                    <td className={TD_CLS}><input type="number" step="0.01" value={row.weight} onChange={(e) => handleUpdate(row.id, 'weight', e.target.value)} className={`${INPUT_CLS} text-center`} placeholder="0.00" disabled={isReadOnly} /></td>
                    <td className={TD_CLS}><input value={row.keterangan} onChange={(e) => handleUpdate(row.id, 'keterangan', e.target.value)} className={INPUT_CLS} placeholder="—" disabled={isReadOnly} /></td>
                    {!isReadOnly && (
                      <td className={`${TD_CLS} text-center`}>
                        <button type="button" onClick={() => handleRemove(row.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            {packingRows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={8} />
                  <td className={`${TD_CLS} text-xs font-semibold text-slate-600`}>{packingRows.reduce((s, r) => s + p(r.qty), 0)}</td>
                  <td />
                  <td />
                  <td className={`${TD_CLS} text-sm font-bold text-emerald-800`}>{fmtRp(totalPackingCost)}</td>
                  <td className={`${TD_CLS} text-xs font-semibold text-slate-600`}>{totalWeight.toFixed(2)}</td>
                  <td colSpan={isReadOnly ? 1 : 2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Quick add line */}
        {!isReadOnly && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-4">
            <button type="button" onClick={() => handleAdd('outer')} className="flex items-center gap-1.5 text-xs text-sky-700 hover:text-sky-900 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Tambah item packing
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Item" value={String(packingRows.length)} sub={Object.entries(categoryGroups).map(([k, v]) => `${CATEGORY_OPTIONS.find(c => c.value === k)?.label ?? k}: ${v.length}`).join(' · ')} color="sky" />
        <SummaryCard label="Total Biaya Packing" value={fmtRp(totalPackingCost)} sub={`Per unit: ${fmtRp(totalPackingCost)}`} color="emerald" />
        <SummaryCard label="Total Berat Packing" value={`${totalWeight.toFixed(2)} kg`} sub={outerBoxVol ? `Vol: ${outerBoxVol} m³` : '—'} color="amber" />
        <SummaryCard label="Container Loading" value={packingInfo.loadPerContainer20 ? `20': ${packingInfo.loadPerContainer20} pcs` : '—'} sub={packingInfo.loadPerContainer40 ? `40': ${packingInfo.loadPerContainer40} pcs` : '—'} color="purple" />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    sky: 'bg-sky-50 border-sky-200 text-sky-900',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.sky}`}>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="text-lg font-bold mt-1 text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5 truncate">{sub}</p>
    </div>
  );
}
