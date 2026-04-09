'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  ChevronDown,
  ChevronRight,
  Eye,
  Layers3,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { BomRow } from '@/types';
import { calcManufactureCost, computeSummary } from '@/lib/calculations';

interface StockInfo {
  partCode: string;
  qtyRequired: number;
  qtyAvailable: number;
}

interface ComponentsTableProps {
  currency: 'IDR' | 'USD' | string;
  bomInputMode?: 'auto' | 'manual';
  bomRows: BomRow[];
  hardwareRows?: unknown[];
  packingRows?: unknown[];
  proses?: string;
  updateBomRow: (id: string, updates: Partial<BomRow>) => void;
  onChangeProses?: (value: string) => void;
  removeBomRow: (id: string) => void;
  onAddLine: () => void;
  onAddMeja: () => void;
  onAddModul: () => void;
  onAddSubModul: () => void;
  onAddOperation: () => void;
  onAddChildUnder?: (parentId: string) => string;
  onAddRowAbove?: (targetRowId: string) => string;
  onOpenCatalog: () => void;
  onOpenDetail?: (row: BomRow) => void;
  onRecalculate: () => void;
  stockByPartCode?: Map<string, StockInfo>;
  onStockClick?: (partCode: string) => void;
  warnUsedInWo?: boolean;
  isReadOnly?: boolean;
}

interface TreatmentOption {
  id: string;
  name: string;
  category: string;
  description: string;
  cost: number;
}

interface TreatmentModalState {
  rowId: string;
  selected: string[];
  category: string;
  search: string;
}

const TREATMENT_OPTIONS: TreatmentOption[] = [
  { id: 'tr-kd', name: 'Kiln Dry', category: 'Kayu', description: 'Stabilisasi kadar air material kayu', cost: 25000 },
  { id: 'tr-antirayap', name: 'Anti Rayap', category: 'Kayu', description: 'Perlindungan rayap untuk furniture indoor', cost: 40000 },
  { id: 'tr-antijamur', name: 'Anti Jamur', category: 'Kayu', description: 'Lapisan anti jamur untuk area lembap', cost: 30000 },
  { id: 'tr-water', name: 'Water Repellent', category: 'Finishing', description: 'Pelindung terhadap cipratan air', cost: 35000 },
  { id: 'tr-uv', name: 'UV Protection', category: 'Finishing', description: 'Menjaga warna dari paparan UV', cost: 50000 },
  { id: 'tr-polish', name: 'High Polish', category: 'Finishing', description: 'Finishing glossy premium', cost: 60000 },
  { id: 'tr-qc', name: 'QC Premium', category: 'Quality', description: 'Pemeriksaan tambahan sebelum packing', cost: 20000 },
  { id: 'tr-pack', name: 'Extra Packaging', category: 'Quality', description: 'Proteksi tambahan saat pengiriman', cost: 15000 },
];

function num(value: string | number | undefined): number {
  return Number.parseFloat(String(value ?? '')) || 0;
}

const USD_TO_IDR_RATE = 16000;

function fmtDualMoney(value: number, currency: string): string {
  if (value <= 0) return '-';
  const inIdr = currency === 'USD' ? value * USD_TO_IDR_RATE : value;
  const inUsd = currency === 'USD' ? value : value / USD_TO_IDR_RATE;
  const idrText = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(inIdr);
  const usdText = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(inUsd);
  return `${idrText} / ${usdText}`;
}

function getIndent(row: BomRow, byId: Map<string, BomRow>): number {
  let depth = 0;
  let parentId = row.parentId;
  while (parentId) {
    depth += 1;
    parentId = byId.get(parentId)?.parentId ?? null;
  }
  return depth;
}

function getWorkerTotal(row: BomRow): number {
  const gaji8Jam = num(row.biayaTenagaKerja);
  const setup = num(row.setupCleanupTime);
  const kerja = num(row.workingTime);
  const pekerjaRaw = num(row.workerCount);
  const pekerja = pekerjaRaw > 0 ? pekerjaRaw : 1;
  const totalMenit = setup + kerja;
  if (gaji8Jam <= 0 || totalMenit <= 0) return 0;
  return (gaji8Jam / (8 * 60)) * totalMenit * pekerja;
}

function parseTreatmentSelection(row: BomRow): string[] {
  const raw = row.treatmentItems;
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item));
  }
  const byName = String(row.treatment ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return TREATMENT_OPTIONS.filter((option) => byName.includes(option.name)).map((option) => option.id);
}

function getLevelMeta(row: BomRow): { label: string; cls: string } {
  const level = row.level;
  if (level === 'module' || row.levelNum === 0) {
    return { label: 'MODUL', cls: 'border-blue-200 bg-blue-50 text-blue-700' };
  }
  if (level === 'submodule' || row.levelNum === 1) {
    return { label: 'SUBMODUL', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  }
  if (level === 'operation' || row.levelNum === 3) {
    return { label: 'OPERATION', cls: 'border-violet-200 bg-violet-50 text-violet-700' };
  }
  return { label: 'PART', cls: 'border-amber-200 bg-amber-50 text-amber-700' };
}

export function ComponentsTable({
  currency,
  bomInputMode = 'auto',
  bomRows,
  hardwareRows = [],
  packingRows = [],
  proses = '',
  updateBomRow,
  onChangeProses,
  removeBomRow,
  onAddLine,
  onAddMeja,
  onAddModul,
  onAddSubModul,
  onAddOperation,
  onAddChildUnder,
  onAddRowAbove,
  onOpenCatalog,
  onOpenDetail,
  onRecalculate,
  stockByPartCode,
  onStockClick,
  warnUsedInWo,
  isReadOnly = false,
}: ComponentsTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(bomRows.filter((row) => row.levelNum <= 1).map((row) => row.id)),
  );
  const [treatmentModal, setTreatmentModal] = useState<TreatmentModalState | null>(null);

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      bomRows
        .filter((row) => row.levelNum <= 1)
        .forEach((row) => next.add(row.id));
      return next;
    });
  }, [bomRows]);

  const rowById = useMemo(() => new Map(bomRows.map((row) => [row.id, row])), [bomRows]);
  const hasChildren = useMemo(() => {
    const ids = new Set<string>();
    bomRows.forEach((row) => {
      if (row.parentId) ids.add(row.parentId);
    });
    return ids;
  }, [bomRows]);

  const visibleRows = useMemo(
    () =>
      bomRows.filter((row) => {
        let parentId = row.parentId;
        while (parentId) {
          if (!expanded.has(parentId)) return false;
          parentId = rowById.get(parentId)?.parentId ?? null;
        }
        return true;
      }),
    [bomRows, expanded, rowById],
  );

  const summary = useMemo(() => computeSummary(bomRows, hardwareRows, packingRows), [bomRows, hardwareRows, packingRows]);
  const totalBiayaMaterial = useMemo(
    () =>
      bomRows.reduce((acc, row) => {
        const qty = num(row.qty);
        const scrap = num(row.scrapPercent);
        const qtyActual = qty * (1 + scrap / 100);
        return acc + num(row.biayaSatuan) * (qtyActual > 0 ? qtyActual : 0);
      }, 0),
    [bomRows],
  );

  const openTreatmentModal = (row: BomRow) => {
    setTreatmentModal({
      rowId: row.id,
      selected: parseTreatmentSelection(row),
      category: 'Semua',
      search: '',
    });
  };

  const selectedTreatmentOptions = treatmentModal
    ? TREATMENT_OPTIONS.filter((option) => treatmentModal.selected.includes(option.id))
    : [];

  const saveTreatments = () => {
    if (!treatmentModal) return;
    const selectedOptions = TREATMENT_OPTIONS.filter((option) => treatmentModal.selected.includes(option.id));
    const treatmentText = selectedOptions.map((option) => option.name).join(', ');
    const treatmentCost = selectedOptions.reduce((acc, option) => acc + option.cost, 0);
    updateBomRow(treatmentModal.rowId, {
      treatment: treatmentText,
      treatmentCost: treatmentCost > 0 ? String(treatmentCost) : '',
      treatmentItems: selectedOptions.map((option) => option.id),
    });
    setTreatmentModal(null);
  };

  const categories = ['Semua', ...Array.from(new Set(TREATMENT_OPTIONS.map((option) => option.category)))];
  const filteredTreatmentOptions = treatmentModal
    ? TREATMENT_OPTIONS.filter((option) => {
        const byCategory = treatmentModal.category === 'Semua' || option.category === treatmentModal.category;
        const keyword = treatmentModal.search.trim().toLowerCase();
        if (!keyword) return byCategory;
        return byCategory && `${option.name} ${option.description}`.toLowerCase().includes(keyword);
      })
    : [];

  const isManual = bomInputMode === 'manual';
  const disableClass = isReadOnly ? 'opacity-60 cursor-not-allowed' : '';

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={onAddModul} disabled={isReadOnly} className={`inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 ${disableClass}`}>
            <Plus className="h-3.5 w-3.5" /> Modul
          </button>
          <button type="button" onClick={onAddSubModul} disabled={isReadOnly} className={`inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 ${disableClass}`}>
            <Layers3 className="h-3.5 w-3.5" /> Sub Modul
          </button>
          <button type="button" onClick={onAddLine} disabled={isReadOnly} className={`inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 ${disableClass}`}>
            <Plus className="h-3.5 w-3.5" /> Baris
          </button>
          <button type="button" onClick={onAddOperation} disabled={isReadOnly} className={`inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 ${disableClass}`}>
            <Sparkles className="h-3.5 w-3.5" /> Operasi
          </button>
          <button type="button" onClick={onAddMeja} disabled={isReadOnly} className={`inline-flex items-center gap-1 rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 ${disableClass}`}>
            <Plus className="h-3.5 w-3.5" /> Template
          </button>
          <button type="button" onClick={onOpenCatalog} disabled={isReadOnly} className={`inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 ${disableClass}`}>
            <Plus className="h-3.5 w-3.5" /> Catalog
          </button>
          <button type="button" onClick={onRecalculate} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Calculator className="h-3.5 w-3.5" /> Hitung Ulang
          </button>
        </div>

        <div className="grid gap-2 md:grid-cols-[2fr,1fr,1fr]">
          <label className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Proses</span>
            <input
              type="text"
              value={proses}
              onChange={(event) => onChangeProses?.(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 outline-none focus:border-sky-500"
              placeholder="Contoh: Assembly + Finishing"
              disabled={isReadOnly}
            />
          </label>
          <div className="rounded-lg border border-slate-200 bg-amber-50 px-2.5 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Total Biaya Material</div>
            <div className="mt-1 text-sm font-bold text-amber-900">{fmtDualMoney(totalBiayaMaterial, currency)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-sky-50 px-2.5 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-700">Total Keseluruhan</div>
            <div className="mt-1 text-sm font-bold text-sky-900">{fmtDualMoney(summary.grand, currency)}</div>
          </div>
        </div>
        {warnUsedInWo && <p className="mt-2 text-[11px] text-amber-700">BOM sedang dipakai WO, perubahan akan berdampak ke costing aktif.</p>}
      </div>

      <div className="scrollbar-visible flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[2200px] border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-200 bg-slate-100">
              <th className="px-2 py-2 text-left font-semibold text-slate-700" colSpan={6}>Komponen</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700" colSpan={4}>Spesifikasi</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700" colSpan={isManual ? 8 : 5}>Manufacture</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700" colSpan={2}>Treatment</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700" colSpan={4}>Detail Keseluruhan</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700">Aksi</th>
            </tr>
            <tr className="border-b border-slate-200 bg-white">
              {['', 'No', 'Kode', 'Nama', 'Qty', 'Unit', 'Grade', 'P', 'L', 'T'].map((head) => (
                <th key={head || 'tree'} className="whitespace-nowrap px-2 py-2 text-left font-semibold uppercase tracking-wider text-[10px] text-slate-500">{head || 'Tree'}</th>
              ))}
              {isManual ? (
                ['Nama Proses', 'Gaji 8 Jam', 'Jml Pekerja', 'Setup (menit)', 'Waktu Kerja (menit)', 'Biaya Pekerja Total', 'Penggunaan Mesin', 'Biaya Mesin'].map((head) => (
                  <th key={head} className="whitespace-nowrap px-2 py-2 text-left font-semibold uppercase tracking-wider text-[10px] text-slate-500">{head}</th>
                ))
              ) : (
                ['Work Center', 'WC Waktu', 'Routing', 'RTG Waktu', 'Biaya Operasi'].map((head) => (
                  <th key={head} className="whitespace-nowrap px-2 py-2 text-left font-semibold uppercase tracking-wider text-[10px] text-slate-500">{head}</th>
                ))
              )}
              {['Combo', 'Biaya Treatment', 'Biaya Material', 'Biaya Pekerja/Operasi', 'Total Semua', 'Notes', ''].map((head, idx) => (
                <th key={`${head}-${idx}`} className="whitespace-nowrap px-2 py-2 text-left font-semibold uppercase tracking-wider text-[10px] text-slate-500">{head || 'Aksi'}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const indent = getIndent(row, rowById);
              const qty = num(row.qty);
              const scrap = num(row.scrapPercent);
              const qtyActual = qty > 0 ? qty * (1 + scrap / 100) : 0;
              const biayaMaterial = num(row.biayaSatuan) * qtyActual;
              const biayaPekerjaTotal = getWorkerTotal(row);
              const biayaOperasi = calcManufactureCost(row);
              const biayaTreatment = num(row.treatmentCost);
              const totalSemua = biayaMaterial + biayaOperasi + biayaTreatment;
              const stock = row.partCode ? stockByPartCode?.get(row.partCode) : undefined;
              const isExpanded = expanded.has(row.id);
              const levelMeta = getLevelMeta(row);

              return (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        hasChildren.has(row.id) &&
                        setExpanded((prev) => {
                          const next = new Set(prev);
                          if (next.has(row.id)) next.delete(row.id);
                          else next.add(row.id);
                          return next;
                        })
                      }
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100"
                    >
                      {hasChildren.has(row.id) ? (isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />) : <span className="text-[10px]">.</span>}
                    </button>
                  </td>
                  <td className="px-2 py-1.5 text-slate-500">{row.no}</td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-slate-700">{row.partCode || '-'}</span>
                      {stock && (
                        <button type="button" onClick={() => onStockClick?.(row.partCode)} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          {stock.qtyAvailable.toFixed(1)}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-2" style={{ marginLeft: `${indent * 14}px` }}>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${levelMeta.cls}`}>
                        {levelMeta.label}
                      </span>
                      <span className="max-w-[260px] truncate font-medium text-slate-800">
                        {row.description || row.modul || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{row.qty || '-'}</td>
                  <td className="px-2 py-1.5 text-slate-700">{row.unit || '-'}</td>
                  <td className="px-2 py-1.5 text-slate-700">{row.grade || '-'}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{row.dimAP || '-'}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{row.dimAL || '-'}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{row.dimAT || '-'}</td>
                  {isManual ? (
                    <>
                      <td className="px-2 py-1.5 text-slate-700">{row.processName || '-'}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{row.biayaTenagaKerja || '-'}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{row.workerCount || '-'}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{row.setupCleanupTime || '-'}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{row.workingTime || '-'}</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-indigo-700">{fmtDualMoney(biayaPekerjaTotal, currency)}</td>
                      <td className="px-2 py-1.5 text-slate-700">{row.machineUsage || '-'}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{row.machineCost || '-'}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-2 py-1.5 text-slate-700">{row.workCenterOrRouting || '-'}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{row.workCenterRunMin || '-'}</td>
                      <td className="px-2 py-1.5 text-slate-700">{row.routingName || '-'}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{row.routingRunMin || '-'}</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-indigo-700">{fmtDualMoney(biayaOperasi, currency)}</td>
                    </>
                  )}
                  <td className="px-2 py-1.5">
                    <button type="button" onClick={() => openTreatmentModal(row)} disabled={isReadOnly} className={`inline-flex w-40 items-center justify-between rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-left text-xs font-semibold text-sky-800 hover:bg-sky-100 ${disableClass}`}>
                      <span className="truncate">{row.treatment || 'Pilih Treatment'}</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </td>
                  <td className="px-2 py-1.5 text-right font-semibold text-cyan-700">{fmtDualMoney(biayaTreatment, currency)}</td>
                  <td className="px-2 py-1.5 text-right font-semibold text-amber-700">{fmtDualMoney(biayaMaterial, currency)}</td>
                  <td className="px-2 py-1.5 text-right font-semibold text-indigo-700">{fmtDualMoney(biayaOperasi, currency)}</td>
                  <td className="px-2 py-1.5 text-right font-bold text-emerald-700">{fmtDualMoney(totalSemua, currency)}</td>
                  <td className="px-2 py-1.5 text-slate-700">{row.manufacturingNotes || '-'}</td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => onOpenDetail?.(row)} className="rounded-md border border-slate-300 p-1 text-slate-600 hover:bg-slate-100"><Eye className="h-3.5 w-3.5" /></button>
                      {onAddChildUnder && <button type="button" onClick={() => onAddChildUnder(row.id)} disabled={isReadOnly} className={`rounded-md border border-slate-300 p-1 text-slate-600 hover:bg-slate-100 ${disableClass}`}><Plus className="h-3.5 w-3.5" /></button>}
                      {onAddRowAbove && <button type="button" onClick={() => onAddRowAbove(row.id)} disabled={isReadOnly} className={`rounded-md border border-slate-300 p-1 text-slate-600 hover:bg-slate-100 ${disableClass}`}><Layers3 className="h-3.5 w-3.5" /></button>}
                      <button type="button" onClick={() => removeBomRow(row.id)} disabled={isReadOnly} className={`rounded-md border border-red-300 p-1 text-red-600 hover:bg-red-50 ${disableClass}`}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={99} className="px-4 py-12 text-center text-sm text-slate-500">
                  Belum ada data komponen. Tambahkan modul atau baris baru untuk mulai.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 bg-slate-50">
              <td colSpan={99} className="px-3 py-2">
                <div className="grid gap-2 md:grid-cols-4">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-amber-700">Biaya Material</div>
                    <div className="text-xs font-bold text-amber-900">{fmtDualMoney(totalBiayaMaterial, currency)}</div>
                  </div>
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-indigo-700">Biaya Pekerja / Operasi</div>
                    <div className="text-xs font-bold text-indigo-900">{fmtDualMoney(summary.mfgCost, currency)}</div>
                  </div>
                  <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-cyan-700">Biaya Treatment</div>
                    <div className="text-xs font-bold text-cyan-900">{fmtDualMoney(summary.treatmentCost, currency)}</div>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-700">Total Keseluruhan</div>
                    <div className="text-xs font-bold text-emerald-900">{fmtDualMoney(summary.grand, currency)}</div>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {treatmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setTreatmentModal(null)} />
          <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-cyan-50 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pilih Treatment (Multiple)</h3>
                <p className="text-xs text-slate-600">Pilih lebih dari satu item, lalu klik Simpan.</p>
              </div>
              <button type="button" onClick={() => setTreatmentModal(null)} className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 p-5">
              <input
                value={treatmentModal.search}
                onChange={(event) => setTreatmentModal((prev) => (prev ? { ...prev, search: event.target.value } : prev))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                placeholder="Cari treatment..."
              />
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setTreatmentModal((prev) => (prev ? { ...prev, category } : prev))}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      treatmentModal.category === category
                        ? 'bg-sky-600 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="grid max-h-[340px] grid-cols-1 gap-2 overflow-auto md:grid-cols-2">
                {filteredTreatmentOptions.map((option) => {
                  const active = treatmentModal.selected.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setTreatmentModal((prev) => {
                          if (!prev) return prev;
                          const selected = prev.selected.includes(option.id)
                            ? prev.selected.filter((id) => id !== option.id)
                            : [...prev.selected, option.id];
                          return { ...prev, selected };
                        })
                      }
                      className={`rounded-xl border p-3 text-left transition ${
                        active
                          ? 'border-sky-300 bg-sky-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">{option.name}</span>
                        <span className="text-xs font-semibold text-sky-700">{fmtDualMoney(option.cost, currency)}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600">{option.description}</p>
                      <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{option.category}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <div className="text-xs text-slate-600">
                <div>{selectedTreatmentOptions.length} item dipilih</div>
                <div className="font-semibold text-slate-900">Total: {fmtDualMoney(selectedTreatmentOptions.reduce((acc, option) => acc + option.cost, 0), currency)}</div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setTreatmentModal(null)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Batal
                </button>
                <button type="button" onClick={saveTreatments} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700">
                  Simpan Treatment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

