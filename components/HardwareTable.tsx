'use client';

import type { HardwareRow } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

interface HardwareTableProps {
  hardwareRows: HardwareRow[];
  updateHardwareRow: (id: string, updates: Partial<HardwareRow>) => void;
  addHardwareRow: () => void;
  removeHardwareRow: (id: string) => void;
}

const CELL_INPUT =
  'w-full px-2 py-1 rounded bg-white border border-slate-300 text-slate-800 text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none';

export function HardwareTable({ hardwareRows, updateHardwareRow, addHardwareRow, removeHardwareRow }: HardwareTableProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Hardware / Miscellaneous</h2>
        <button type="button" onClick={addHardwareRow} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
          Tambah baris
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100">
              <th className="text-left py-2 px-3 w-12 font-semibold text-slate-600 uppercase text-xs">No</th>
              <th className="text-left py-2 px-3 min-w-[140px] font-semibold text-slate-600 uppercase text-xs">Kode</th>
              <th className="text-left py-2 px-3 min-w-[200px] font-semibold text-slate-600 uppercase text-xs">Deskripsi</th>
              <th className="text-left py-2 px-3 w-28 font-semibold text-slate-600 uppercase text-xs">Material</th>
              <th className="text-left py-2 px-3 w-32 font-semibold text-slate-600 uppercase text-xs">Jenis</th>
              <th className="text-left py-2 px-3 w-20 font-semibold text-slate-600 uppercase text-xs">Qty</th>
              <th className="text-right py-2 px-3 w-12 font-semibold text-slate-600 uppercase text-xs"></th>
            </tr>
          </thead>
          <tbody>
            {hardwareRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">Belum ada data hardware. Klik &quot;Tambah baris&quot; untuk menambah.</td>
              </tr>
            ) : (
              hardwareRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="py-1.5 px-3 text-center text-slate-700">{row.no}</td>
                  <td className="py-1.5 px-3">
                    <input value={row.partCode ?? ''} onChange={(e) => updateHardwareRow(row.id, { partCode: e.target.value })} className={CELL_INPUT} />
                  </td>
                  <td className="py-1.5 px-3">
                    <input value={row.description ?? ''} onChange={(e) => updateHardwareRow(row.id, { description: e.target.value })} className={CELL_INPUT} />
                  </td>
                  <td className="py-1.5 px-3">
                    <input value={row.material ?? ''} onChange={(e) => updateHardwareRow(row.id, { material: e.target.value })} className={CELL_INPUT} />
                  </td>
                  <td className="py-1.5 px-3">
                    <select value={row.jenisHardware ?? 'FITTING'} onChange={(e) => updateHardwareRow(row.id, { jenisHardware: e.target.value })} className={CELL_INPUT}>
                      <option value="FITTING">FITTING</option>
                      <option value="ASSEMBLING">ASSEMBLING</option>
                    </select>
                  </td>
                  <td className="py-1.5 px-3">
                    <input type="text" value={row.qty ?? ''} onChange={(e) => updateHardwareRow(row.id, { qty: e.target.value })} className={`${CELL_INPUT} w-16 text-right`} />
                  </td>
                  <td className="py-1.5 px-3 text-right">
                    <button type="button" onClick={() => removeHardwareRow(row.id)} className="p-1 text-slate-500 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
