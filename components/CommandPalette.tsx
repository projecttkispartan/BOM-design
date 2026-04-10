'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, List, Wrench, LayoutList, Calculator, LayoutGrid } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  action: string;
  payload?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const COMMANDS: Command[] = [
  { id: 'load-meja', label: 'Load sample: Meja Belajar', action: 'loadSample', payload: 'meja-belajar', icon: List },
  { id: 'add-meja', label: '+ Tambah template (hirarki lengkap)', action: 'addMeja', icon: Plus },
  { id: 'add-modul', label: 'Tambah Produk Jadi (eCount)', action: 'addModul', icon: Plus },
  { id: 'add-submodul', label: 'Tambah Sub Assembly', action: 'addSubModul', icon: Plus },
  { id: 'add-part', label: 'Tambah Bahan Baku', action: 'addPart', icon: Plus },
  { id: 'save', label: 'Simpan Draft', action: 'saveDraft', icon: Save },
  { id: 'view-kalkulasi', label: 'View Kalkulasi', action: 'viewKalkulasi', icon: Calculator },
  { id: 'tab-components', label: 'Beralih ke Components', action: 'switchTab', payload: 'components', icon: List },
  { id: 'tab-operations', label: 'Beralih ke Operations', action: 'switchTab', payload: 'operations', icon: Wrench },
  { id: 'tab-scenario', label: 'Beralih ke Scenario Kalkulasi', action: 'switchTab', payload: 'scenario', icon: Calculator },
  { id: 'tab-miscellaneous', label: 'Beralih ke Miscellaneous', action: 'switchTab', payload: 'miscellaneous', icon: LayoutList },
  { id: 'density-compact', label: 'Kepadatan: Compact', action: 'setDensity', payload: 'compact', icon: LayoutGrid },
  { id: 'density-comfortable', label: 'Kepadatan: Comfortable', action: 'setDensity', payload: 'comfortable', icon: LayoutGrid },
];

function fuzzyMatch(query: string, text: string): boolean {
  const q = (query || '').toLowerCase().replace(/\s+/g, '');
  const t = (text || '').toLowerCase().replace(/\s+/g, '');
  if (!q) return true;
  let ti = 0;
  for (let i = 0; i < q.length; i++) {
    const idx = t.indexOf(q[i], ti);
    if (idx === -1) return false;
    ti = idx + 1;
  }
  return true;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onCommand: (action: string, payload?: string) => void;
  activeTab: string;
  switchTab: (tab: string) => void;
}

export function CommandPalette({ open, onClose, onCommand, switchTab }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  const filtered = typeof query === 'string' && query.trim() ? COMMANDS.filter((c) => fuzzyMatch(query, c.label)) : COMMANDS;

  const run = useCallback(
    (cmd: Command) => {
      if (cmd.action === 'loadSample') onCommand('loadSample', cmd.payload);
      if (cmd.action === 'addMeja') onCommand('addMeja');
      if (cmd.action === 'addModul') onCommand('addModul');
      if (cmd.action === 'addSubModul') onCommand('addSubModul');
      if (cmd.action === 'addPart') onCommand('addPart');
      if (cmd.action === 'saveDraft') onCommand('saveDraft');
      if (cmd.action === 'viewKalkulasi') onCommand('viewKalkulasi');
      if (cmd.action === 'switchTab') switchTab(cmd.payload ?? 'components');
      if (cmd.action === 'setDensity') onCommand('setDensity', cmd.payload);
      onClose();
    },
    [onCommand, onClose, switchTab]
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
    }
  }, [open]);

  useEffect(() => {
    if (selected >= filtered.length) setSelected(Math.max(0, filtered.length - 1));
  }, [filtered.length, selected]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => (s + 1) % filtered.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => (s - 1 + filtered.length) % filtered.length);
      }
      if (e.key === 'Enter' && filtered[selected]) {
        e.preventDefault();
        run(filtered[selected]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, selected, onClose, run]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" aria-hidden onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-3 border-b border-slate-200">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari perintah (Ctrl+K)..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
            autoFocus
          />
        </div>
        <ul className="max-h-[60vh] overflow-auto py-2">
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            return (
              <li key={cmd.id}>
                <button
                  type="button"
                  onClick={() => run(cmd)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm ${i === selected ? 'bg-sky-100 text-sky-900' : 'text-slate-800 hover:bg-slate-50'}`}
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  {cmd.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
