'use client';

import { useMemo, useState } from 'react';
import { X, Plus, Minus, Pencil } from 'lucide-react';
import type { BomVersionDetail } from '@/lib/bomApiClient';
import type { BomRow, BomMetadata } from '@/types';
import { StatusBadge } from './StatusBadge';

function fmtRp(n: number): string {
  if (!n) return 'Rp 0';
  return 'Rp ' + n.toLocaleString('id-ID');
}

interface VersionDiffModalProps {
  open: boolean;
  onClose: () => void;
  versions: BomVersionDetail[];
  defaultLeftId?: string;
  defaultRightId?: string;
}

interface FieldDiff {
  field: string;
  label: string;
  oldVal: string;
  newVal: string;
}

interface RowDiff {
  type: 'added' | 'removed' | 'changed' | 'unchanged';
  rowId: string;
  no: number;
  name: string;
  changes: FieldDiff[];
}

function diffMetadata(oldM: BomMetadata, newM: BomMetadata): FieldDiff[] {
  const fields: { key: keyof BomMetadata; label: string }[] = [
    { key: 'productName', label: 'Nama Produk' },
    { key: 'productCode', label: 'Kode' },
    { key: 'customer', label: 'Customer' },
    { key: 'itemType', label: 'Item Type' },
    { key: 'wood', label: 'Wood' },
    { key: 'coatingColor', label: 'Coating' },
    { key: 'bomType', label: 'BoM Type' },
    { key: 'bomQuantity', label: 'Quantity' },
    { key: 'itemWidth', label: 'Width' },
    { key: 'itemDepth', label: 'Depth' },
    { key: 'itemHeight', label: 'Height' },
    { key: 'reference', label: 'Reference' },
  ];

  return fields
    .filter((f) => String(oldM[f.key] ?? '') !== String(newM[f.key] ?? ''))
    .map((f) => ({
      field: String(f.key),
      label: f.label,
      oldVal: String(oldM[f.key] ?? '') || '(kosong)',
      newVal: String(newM[f.key] ?? '') || '(kosong)',
    }));
}

function diffRows(oldRows: BomRow[], newRows: BomRow[]): RowDiff[] {
  const oldMap = new Map(oldRows.map((r) => [r.id, r]));
  const newMap = new Map(newRows.map((r) => [r.id, r]));
  const allIds = new Set([...oldRows.map((r) => r.id), ...newRows.map((r) => r.id)]);
  const diffs: RowDiff[] = [];

  const compareFields: { key: keyof BomRow; label: string }[] = [
    { key: 'partCode', label: 'Kode' },
    { key: 'description', label: 'Komponen' },
    { key: 'qty', label: 'QTY' },
    { key: 'dimAP', label: 'P' },
    { key: 'dimAL', label: 'L' },
    { key: 'dimAT', label: 'T' },
    { key: 'biayaSatuan', label: 'Biaya Satuan' },
    { key: 'workCenterOrRouting', label: 'Work Center' },
    { key: 'routingName', label: 'Routing' },
    { key: 'surface', label: 'Surface' },
    { key: 'surfaceCost', label: 'Biaya Surface' },
    { key: 'treatment', label: 'Treatment' },
    { key: 'treatmentCost', label: 'Biaya Treatment' },
    { key: 'jenis', label: 'Jenis' },
    { key: 'grade', label: 'Grade' },
    { key: 'material', label: 'Material' },
  ];

  allIds.forEach((id) => {
    const oldR = oldMap.get(id);
    const newR = newMap.get(id);

    if (!oldR && newR) {
      diffs.push({ type: 'added', rowId: id, no: newR.no, name: newR.description || newR.modul || '—', changes: [] });
    } else if (oldR && !newR) {
      diffs.push({ type: 'removed', rowId: id, no: oldR.no, name: oldR.description || oldR.modul || '—', changes: [] });
    } else if (oldR && newR) {
      const changes = compareFields
        .filter((f) => String(oldR[f.key] ?? '') !== String(newR[f.key] ?? ''))
        .map((f) => ({
          field: String(f.key),
          label: f.label,
          oldVal: String(oldR[f.key] ?? '') || '(kosong)',
          newVal: String(newR[f.key] ?? '') || '(kosong)',
        }));

      if (changes.length > 0) {
        diffs.push({ type: 'changed', rowId: id, no: newR.no, name: newR.description || newR.modul || '—', changes });
      }
    }
  });

  return diffs.sort((a, b) => a.no - b.no);
}

export function VersionDiffModal({ open, onClose, versions, defaultLeftId, defaultRightId }: VersionDiffModalProps) {
  const sorted = useMemo(() => [...versions].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [versions]);
  const [leftId, setLeftId] = useState(defaultLeftId ?? sorted[Math.max(0, sorted.length - 2)]?.versionId ?? '');
  const [rightId, setRightId] = useState(defaultRightId ?? sorted[sorted.length - 1]?.versionId ?? '');

  const leftVer = sorted.find((v) => v.versionId === leftId);
  const rightVer = sorted.find((v) => v.versionId === rightId);

  const metaDiffs = useMemo(
    () => (leftVer && rightVer ? diffMetadata(leftVer.metadata, rightVer.metadata) : []),
    [leftVer, rightVer],
  );

  const rowDiffs = useMemo(
    () => (leftVer && rightVer ? diffRows(leftVer.bomRows, rightVer.bomRows) : []),
    [leftVer, rightVer],
  );

  const addedCount = rowDiffs.filter((d) => d.type === 'added').length;
  const removedCount = rowDiffs.filter((d) => d.type === 'removed').length;
  const changedCount = rowDiffs.filter((d) => d.type === 'changed').length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Perbandingan Versi</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Bandingkan data antar versi BOM</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Version selectors */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-200 shrink-0">
          <div className="flex-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Versi Lama</label>
            <select value={leftId} onChange={(e) => setLeftId(e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none appearance-none">
              {sorted.map((v) => <option key={v.versionId} value={v.versionId}>v{v.version} — {v.status}</option>)}
            </select>
          </div>
          <span className="text-slate-400 text-xs font-medium pt-4">vs</span>
          <div className="flex-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Versi Baru</label>
            <select value={rightId} onChange={(e) => setRightId(e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none appearance-none">
              {sorted.map((v) => <option key={v.versionId} value={v.versionId}>v{v.version} — {v.status}</option>)}
            </select>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-3 px-6 py-2.5 border-b border-slate-200 shrink-0 flex-wrap">
          {addedCount > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium border border-emerald-200">+{addedCount} ditambahkan</span>}
          {removedCount > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium border border-red-200">−{removedCount} dihapus</span>}
          {changedCount > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium border border-amber-200">✏ {changedCount} diubah</span>}
          {metaDiffs.length > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 font-medium border border-sky-200">{metaDiffs.length} header berubah</span>}
          {metaDiffs.length === 0 && rowDiffs.length === 0 && <span className="text-[10px] text-slate-400">Tidak ada perbedaan</span>}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-visible px-6 py-4 space-y-4">
          {/* Header changes */}
          {metaDiffs.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Perubahan Header</h3>
              <div className="space-y-1">
                {metaDiffs.map((d) => (
                  <div key={d.field} className="flex items-center gap-3 text-xs py-1.5 px-3 rounded-lg bg-amber-50 border border-amber-200">
                    <Pencil className="w-3 h-3 text-amber-700 shrink-0" />
                    <span className="text-slate-600 w-24 shrink-0">{d.label}</span>
                    <span className="text-red-600 line-through">{d.oldVal}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-emerald-800 font-medium">{d.newVal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row changes */}
          {rowDiffs.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Perubahan Komponen</h3>
              <div className="space-y-1">
                {rowDiffs.map((d) => (
                  <div key={d.rowId} className={`py-2 px-3 rounded-lg border ${
                    d.type === 'added' ? 'bg-emerald-50 border-emerald-200' :
                    d.type === 'removed' ? 'bg-red-50 border-red-200' :
                    'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-center gap-2 text-xs">
                      {d.type === 'added' && <Plus className="w-3 h-3 text-emerald-700" />}
                      {d.type === 'removed' && <Minus className="w-3 h-3 text-red-600" />}
                      {d.type === 'changed' && <Pencil className="w-3 h-3 text-amber-700" />}
                      <span className="text-slate-500">Row {d.no}</span>
                      <span className={`font-medium ${d.type === 'removed' ? 'text-red-700 line-through' : d.type === 'added' ? 'text-emerald-800' : 'text-slate-800'}`}>
                        {d.name}
                      </span>
                      {d.type === 'added' && <span className="text-emerald-700 text-[10px]">(baru)</span>}
                      {d.type === 'removed' && <span className="text-red-600 text-[10px]">(dihapus)</span>}
                    </div>
                    {d.changes.length > 0 && (
                      <div className="mt-1.5 ml-5 space-y-0.5">
                        {d.changes.map((c) => (
                          <div key={c.field} className="flex items-center gap-2 text-[11px]">
                            <span className="text-slate-500 w-20">{c.label}:</span>
                            <span className="text-red-600 line-through">{c.oldVal}</span>
                            <span className="text-slate-300">→</span>
                            <span className="text-emerald-800">{c.newVal}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
