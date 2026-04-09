'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Operation } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

function num(v: string | number | undefined): number {
  return parseFloat(String(v ?? '')) || 0;
}

function fmtRp(n: number): string {
  if (n === 0) return '—';
  return 'Rp ' + n.toLocaleString('id-ID');
}

function generateOpId(): string {
  return 'op' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

const TH = 'py-2 px-3 font-semibold text-slate-600 uppercase text-[10px] tracking-wider whitespace-nowrap';
const INPUT_CLS =
  'w-full px-2 py-1 rounded bg-transparent border border-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-sky-500 focus:outline-none text-slate-800 text-xs transition-all tabular-nums placeholder:text-slate-400';

interface OperationsTableProps {
  operations: Operation[];
  onUpdate: (ops: Operation[]) => void;
}

export function OperationsTable({ operations, onUpdate }: OperationsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const addOperation = useCallback(() => {
    const newOp: Operation = {
      id: generateOpId(),
      no: operations.length + 1,
      name: '',
      manufacture: '',
      workCenter: '',
      routing: '',
      setupMin: '',
      runMin: '',
      costPerHour: '',
      totalCost: '',
      linkedComponentIds: [],
    };
    onUpdate([...operations, newOp]);
  }, [operations, onUpdate]);

  const updateOp = useCallback(
    (id: string, field: keyof Operation, value: string) => {
      const updated = operations.map((op) => {
        if (op.id !== id) return op;
        const next = { ...op, [field]: value };
        const setup = num(next.setupMin);
        const run = num(next.runMin);
        const rate = num(next.costPerHour);
        const total = ((setup + run) / 60) * rate;
        next.totalCost = total ? String(Math.round(total)) : '';
        return next;
      });
      onUpdate(updated);
    },
    [operations, onUpdate],
  );

  const removeOp = useCallback(
    (id: string) => {
      const filtered = operations.filter((op) => op.id !== id).map((op, i) => ({ ...op, no: i + 1 }));
      onUpdate(filtered);
      setDeleteId(null);
    },
    [operations, onUpdate],
  );

  const totals = useMemo(() => {
    let waktu = 0;
    let biaya = 0;
    operations.forEach((op) => {
      waktu += num(op.setupMin) + num(op.runMin);
      biaya += num(op.totalCost);
    });
    return { waktu, biaya };
  }, [operations]);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Operations / Routing</h3>
        <button
          type="button"
          onClick={addOperation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Operasi
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 scrollbar-visible">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className={`${TH} text-center w-12`}>No</th>
              <th className={`${TH} text-left min-w-[160px]`}>Operasi</th>
              <th className={`${TH} text-left min-w-[140px]`}>Manufacture</th>
              <th className={`${TH} text-left min-w-[120px]`}>Work Center</th>
              <th className={`${TH} text-left min-w-[120px]`}>Routing</th>
              <th className={`${TH} text-right w-20`}>Setup (min)</th>
              <th className={`${TH} text-right w-20`}>Run (min)</th>
              <th className={`${TH} text-right w-28`}>Biaya/Jam</th>
              <th className={`${TH} text-right w-28`}>Total Biaya</th>
              <th className={`${TH} w-16`}></th>
            </tr>
          </thead>
          <tbody>
            {operations.map((op) => (
              <tr key={op.id} className="border-b border-slate-100 hover:bg-slate-50/80 group">
                <td className="py-1.5 px-3 text-center text-slate-500 text-xs">{op.no}</td>
                <td className="py-1 px-1.5">
                  <input type="text" value={op.name} onChange={(e) => updateOp(op.id, 'name', e.target.value)} placeholder="Nama operasi" className={INPUT_CLS} />
                </td>
                <td className="py-1 px-1.5">
                  <input type="text" value={op.manufacture ?? ''} onChange={(e) => updateOp(op.id, 'manufacture', e.target.value)} placeholder="Manufacture" className={INPUT_CLS} />
                </td>
                <td className="py-1 px-1.5">
                  <input type="text" value={op.workCenter} onChange={(e) => updateOp(op.id, 'workCenter', e.target.value)} placeholder="—" className={INPUT_CLS} />
                </td>
                <td className="py-1 px-1.5">
                  <input type="text" value={op.routing} onChange={(e) => updateOp(op.id, 'routing', e.target.value)} placeholder="—" className={INPUT_CLS} />
                </td>
                <td className="py-1 px-1.5">
                  <input type="text" value={op.setupMin} onChange={(e) => updateOp(op.id, 'setupMin', e.target.value)} placeholder="0" className={`${INPUT_CLS} text-right`} />
                </td>
                <td className="py-1 px-1.5">
                  <input type="text" value={op.runMin} onChange={(e) => updateOp(op.id, 'runMin', e.target.value)} placeholder="0" className={`${INPUT_CLS} text-right`} />
                </td>
                <td className="py-1 px-1.5">
                  <input type="text" value={op.costPerHour} onChange={(e) => updateOp(op.id, 'costPerHour', e.target.value)} placeholder="0" className={`${INPUT_CLS} text-right`} />
                </td>
                <td className="py-1.5 px-3 text-right text-xs font-medium text-amber-700 tabular-nums">{fmtRp(num(op.totalCost))}</td>
                <td className="py-1 px-1.5 text-center">
                  {deleteId === op.id ? (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => removeOp(op.id)} className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white bg-red-500 hover:bg-red-600">
                        Ya
                      </button>
                      <button type="button" onClick={() => setDeleteId(null)} className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 hover:bg-slate-100">
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteId(op.id)}
                      className="p-1 rounded text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {operations.length === 0 && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-xs text-slate-500">
                  Belum ada operasi. Klik &quot;Tambah Operasi&quot; untuk mulai.
                </td>
              </tr>
            )}
          </tbody>
          {operations.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td colSpan={5} className="py-2.5 px-3">
                  <span className="text-xs font-bold text-slate-800 uppercase">Total</span>
                  <span className="text-[11px] text-slate-500 ml-2">{operations.length} operasi</span>
                </td>
                <td colSpan={2} className="py-2.5 px-3 text-right">
                  <div className="text-[10px] text-slate-500 uppercase">Waktu</div>
                  <div className="text-xs font-bold text-slate-800 tabular-nums">{totals.waktu} min</div>
                </td>
                <td className="py-2.5 px-3"></td>
                <td className="py-2.5 px-3 text-right">
                  <div className="text-[10px] text-slate-500 uppercase">Biaya</div>
                  <div className="text-xs font-bold text-sky-700 tabular-nums">{fmtRp(totals.biaya)}</div>
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
