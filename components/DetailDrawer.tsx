'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { BomRow } from '@/types';
import { calcM2, calcManufactureCost, calcVolInvoice, computeVolInline } from '@/lib/calculations';
import { useMasterData } from '@/context/MasterDataContext';

function num(v: string | number | undefined): number {
  return parseFloat(String(v ?? '')) || 0;
}

function fmtRp(n: number): string {
  if (n === 0) return '-';
  return 'Rp ' + n.toLocaleString('id-ID');
}

interface DetailDrawerProps {
  row: BomRow | null;
  allRows: BomRow[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<BomRow>) => void;
  bomInputMode?: 'auto' | 'manual';
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Field({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium tabular-nums text-slate-900">
        {value}
        {suffix ? <span className="ml-1 text-slate-400">{suffix}</span> : null}
      </span>
    </div>
  );
}

const DIM_TABS = [
  { key: 'A', label: 'Dim A (Raw)', pField: 'dimAP', lField: 'dimAL', tField: 'dimAT' },
  { key: 'B', label: 'Dim B', pField: 'dimBP', lField: 'dimBL', tField: 'dimBT' },
  { key: 'C', label: 'Dim C', pField: 'dimCP', lField: 'dimCL', tField: 'dimCT' },
  { key: 'D', label: 'Dim D (Final)', pField: 'dimDP', lField: 'dimDL', tField: 'dimDT' },
] as const;

const SURFACE_OPTIONS = ['', 'Melamine', 'Lacquer', 'Veneer', 'HPL', 'Powder Coating'];
const TREATMENT_OPTIONS = ['', 'Anti Rayap', 'Anti Jamur', 'Kiln Dry', 'Water Repellent', 'UV Protection'];

export function DetailDrawer({ row, allRows, onClose, onUpdate, bomInputMode = 'auto' }: DetailDrawerProps) {
  const [dimTab, setDimTab] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const { masterData, incrementMaterialUsage } = useMasterData();

  if (!row) return null;

  const parent = row.parentId ? allRows.find((r) => r.id === row.parentId) : null;
  const parentName = parent?.description || parent?.modul || '-';

  const materialCost = num(row.biayaSatuan) * (num(row.qty) || 1);
  const mfgCost = calcManufactureCost(row);
  const workerTotalManual = (() => {
    const gaji8Jam = num(row.biayaTenagaKerja);
    const setupMin = num(row.setupCleanupTime);
    const workMin = num(row.workingTime);
    const workerCount = num(row.workerCount) > 0 ? num(row.workerCount) : 1;
    const totalMinutes = setupMin + workMin;
    if (gaji8Jam <= 0 || totalMinutes <= 0) return 0;
    return (gaji8Jam / (8 * 60)) * totalMinutes * workerCount;
  })();
  const legacySurfaceCost = num(row.edgingCost) + num(row.finishingCost);
  const surfaceCost = num(row.surfaceCost) || legacySurfaceCost;
  const treatmentCost = num(row.treatmentCost);
  const totalCost = materialCost + mfgCost + surfaceCost + treatmentCost;
  const isManualManufacture = bomInputMode === 'manual';

  const liveVol = computeVolInline(row);
  const liveM2 = calcM2(row);
  const liveVolInv = calcVolInvoice(row);

  const typeLabel = row.levelNum === 0 ? 'MODUL' : row.levelNum === 1 ? 'SUB MODUL' : 'PART';
  const typeColor = row.levelNum === 0 ? 'bg-blue-600' : row.levelNum === 1 ? 'bg-emerald-600' : 'bg-amber-600';

  const handleFieldChange =
    (field: keyof BomRow) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      onUpdate(row.id, { [field]: e.target.value });
    };

  const EditableField = ({ label, field, suffix }: { label: string; field: keyof BomRow; suffix?: string }) => (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="shrink-0 text-slate-500">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={String(row[field] ?? '')}
          onChange={handleFieldChange(field)}
          className="w-28 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-right text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        {suffix && <span className="text-[10px] text-slate-400">{suffix}</span>}
      </div>
    </div>
  );

  const activeDim = DIM_TABS.find((t) => t.key === dimTab)!;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <div className="scrollbar-visible relative w-full max-w-md animate-slide-in-right overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold text-white ${typeColor}`}>{typeLabel}</span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">{row.description || row.modul || 'Tanpa Nama'}</div>
              <div className="text-[11px] text-slate-500">{row.partCode || '-'}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <Section title="Informasi Dasar">
            <EditableField label="Kode" field="partCode" />
            <Field label="Tipe" value={typeLabel} />
            <Field label="Parent" value={parentName} />
            <EditableField label="QTY" field="qty" suffix={row.unit} />
            <EditableField label="Unit" field="unit" />
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="shrink-0 text-slate-500">Material</span>
              <select
                value={row.material ?? ''}
                onChange={(e) => {
                  const material = masterData.materials.find((m) => m.id === e.target.value);
                  if (material) {
                    onUpdate(row.id, { material: material.name, kodeMat: material.code || '' });
                    incrementMaterialUsage(material.id);
                  }
                }}
                className="w-28 appearance-none rounded border border-slate-300 bg-white px-1.5 py-0.5 text-right text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">-</option>
                {masterData.materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="shrink-0 text-slate-500">Jenis</span>
              <select value={row.jenis ?? ''} onChange={handleFieldChange('jenis')} className="w-28 appearance-none rounded border border-slate-300 bg-white px-1.5 py-0.5 text-right text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500">
                <option value="">-</option>
                {Array.from(new Set(masterData.materials.map((m) => m.jenis).filter(Boolean))).map((jenis) => (
                  <option key={jenis} value={jenis}>
                    {jenis}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="shrink-0 text-slate-500">Grade</span>
              <select value={row.grade ?? ''} onChange={handleFieldChange('grade')} className="w-28 appearance-none rounded border border-slate-300 bg-white px-1.5 py-0.5 text-right text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500">
                <option value="">-</option>
                {Array.from(new Set(masterData.materials.map((m) => m.grade).filter(Boolean))).map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
            <EditableField label="WBS" field="wbs" />
          </Section>

          <Section title="Dimensi Pembahanan">
            <div className="mb-3 flex gap-1">
              {DIM_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setDimTab(t.key as typeof dimTab)}
                  className={`flex-1 rounded py-1.5 text-[10px] font-semibold transition-colors ${dimTab === t.key ? 'border border-sky-300 bg-sky-100 text-sky-900' : 'border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  {t.key}
                </button>
              ))}
            </div>
            <p className="mb-2 text-[10px] text-slate-500">{activeDim.label}</p>
            <EditableField label="Panjang (P)" field={activeDim.pField as keyof BomRow} suffix="mm" />
            <EditableField label="Lebar (L)" field={activeDim.lField as keyof BomRow} suffix="mm" />
            <EditableField label="Tebal (T)" field={activeDim.tField as keyof BomRow} suffix="mm" />
            <div className="mt-2 border-t border-slate-200 pt-2">
              <Field label="Vol Cutting" value={liveVol || '-'} suffix="m3" />
              <Field label="M2" value={liveM2 || '-'} suffix="m2" />
              <Field label="Vol Invoice" value={liveVolInv || '-'} suffix="m3" />
            </div>
          </Section>

          <Section title="Biaya">
            <EditableField label="Biaya Satuan" field="biayaSatuan" suffix="Rp" />
            <Field label="Material Total" value={fmtRp(materialCost)} />
            <Field label="Manufacture" value={fmtRp(mfgCost)} />
            <Field label="Surface" value={fmtRp(surfaceCost)} />
            <Field label="Treatment" value={fmtRp(treatmentCost)} />
            <div className="mt-1.5 flex items-center justify-between border-t border-slate-200 pt-1.5 text-xs">
              <span className="font-semibold text-slate-700">Total</span>
              <span className="font-bold tabular-nums text-sky-700">{fmtRp(totalCost)}</span>
            </div>
          </Section>

          <Section title="Manufacture">
            <div className="mb-2 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
              <strong>Mode Proses:</strong> {isManualManufacture ? 'Manual' : 'Auto (Work Center & Routing)'}
            </div>
            {isManualManufacture ? (
              <>
                <EditableField label="Nama proses" field="processName" />
                <EditableField label="Gaji 8 Jam" field="biayaTenagaKerja" suffix="Rp" />
                <EditableField label="Jumlah pekerja" field="workerCount" />
                <EditableField label="Setup clean up" field="setupCleanupTime" suffix="menit" />
                <EditableField label="Waktu kerja" field="workingTime" suffix="menit" />
                <Field label="Biaya pekerja total" value={fmtRp(workerTotalManual)} />
                <EditableField label="Unit" field="manufacturingUnit" />
                <EditableField label="Penggunaan mesin" field="machineUsage" />
                <EditableField label="Machine cost" field="machineCost" suffix="Rp" />
                <EditableField label="Total cost" field="totalManufactureCost" suffix="Rp" />
                <div className="text-xs">
                  <span className="mb-1 block text-slate-500">Notes</span>
                  <textarea
                    value={String(row.manufacturingNotes ?? '')}
                    onChange={handleFieldChange('manufacturingNotes')}
                    rows={2}
                    className="w-full resize-none rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Catatan manufacture..."
                  />
                </div>
              </>
            ) : (
              <>
                <EditableField label="Work Center" field="workCenterOrRouting" />
                <EditableField label="Routing" field="routingName" />
                <EditableField label="Waktu WC" field="workCenterRunMin" suffix="min" />
                <EditableField label="Waktu Routing" field="routingRunMin" suffix="min" />
                <EditableField label="Biaya WC" field="workCenterCost" suffix="Rp" />
                <EditableField label="Biaya Routing" field="routingCost" suffix="Rp" />
              </>
            )}
            <Field label="Total Manufacture" value={fmtRp(mfgCost)} />
          </Section>

          <Section title="Proses Surface & Treatment">
            <div className="mb-3 rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs text-blue-800">
              <strong>Opsional:</strong> Pilih kombinasi surface dan treatment sesuai kebutuhan produk.
            </div>
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="shrink-0 text-slate-500">Surface</span>
              <select
                value={(row.surface as string) || row.finishing || row.edging || ''}
                onChange={(e) => onUpdate(row.id, { surface: e.target.value })}
                className="w-40 appearance-none rounded border border-slate-300 bg-white px-1.5 py-0.5 text-right text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {SURFACE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option || '-'}
                  </option>
                ))}
              </select>
            </div>
            <EditableField label="Biaya Surface" field="surfaceCost" suffix="Rp" />
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="shrink-0 text-slate-500">Treatment</span>
              <select
                value={row.treatment ?? ''}
                onChange={(e) => onUpdate(row.id, { treatment: e.target.value })}
                className="w-40 appearance-none rounded border border-slate-300 bg-white px-1.5 py-0.5 text-right text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {TREATMENT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option || '-'}
                  </option>
                ))}
              </select>
            </div>
            <EditableField label="Biaya Treatment" field="treatmentCost" suffix="Rp" />
          </Section>

          <Section title="Catatan">
            <textarea
              value={row.keterangan ?? ''}
              onChange={handleFieldChange('keterangan')}
              rows={2}
              className="w-full resize-none rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Tambah catatan..."
            />
          </Section>
        </div>

        <div className="sticky bottom-0 flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
