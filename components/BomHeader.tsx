'use client';

import { useState } from 'react';
import { Save, Calculator, Settings, Undo2, Redo2 } from 'lucide-react';

interface BomHeaderProps {
  onSave: () => void;
  onCommand: () => void;
  onViewKalkulasi: () => void;
  onAddProduk?: () => void;
  onAddSubAssembly?: () => void;
  onAddBahanBaku?: () => void;
  changeCount?: number;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  lastSavedLabel?: string | null;
}

export function BomHeader({
  onSave,
  onCommand,
  onViewKalkulasi,
  onAddProduk,
  onAddSubAssembly,
  onAddBahanBaku,
  changeCount = 0,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  lastSavedLabel,
}: BomHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasChanges = changeCount > 0;

  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 shadow-sm">
      <h1 className="text-base font-semibold text-slate-800">BoM</h1>
      <div className="flex items-center gap-2">
        {onUndo && (
          <button type="button" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-slate-200">
            <Undo2 className="w-4 h-4" />
          </button>
        )}
        {onRedo && (
          <button type="button" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y / Ctrl+Shift+Z)" className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-slate-200">
            <Redo2 className="w-4 h-4" />
          </button>
        )}
        <div className="flex flex-col items-end">
          <button
            type="button"
            onClick={onSave}
            title="Simpan (Ctrl+S)"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white ${hasChanges ? 'bg-amber-500 hover:bg-amber-600 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-600'}`}
          >
            <Save className="w-4 h-4" />
            {hasChanges ? `Simpan (${changeCount})` : 'Simpan'}
          </button>
          {lastSavedLabel && <span className="text-[10px] text-slate-500 mt-0.5">{lastSavedLabel}</span>}
        </div>
        <button
          type="button"
          onClick={onViewKalkulasi}
          title="Lihat Kalkulasi BOM"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 border border-slate-300 hover:border-sky-400 hover:bg-sky-50"
        >
          <Calculator className="w-4 h-4" />
          Hitung BOM
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50"
          >
            <Settings className="w-4 h-4" />
            Pengaturan
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 min-w-[220px] py-1 rounded-lg bg-white border border-slate-200 shadow-xl">
                <button type="button" className="w-full px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-50" onClick={() => { onAddProduk?.(); setMenuOpen(false); }}>Tambah Produk Jadi</button>
                <button type="button" className="w-full px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-50" onClick={() => { onAddSubAssembly?.(); setMenuOpen(false); }}>Tambah Sub Assembly</button>
                <button type="button" className="w-full px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-50" onClick={() => { onAddBahanBaku?.(); setMenuOpen(false); }}>Tambah Bahan Baku</button>
                <button type="button" className="w-full px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-50" onClick={() => { onViewKalkulasi(); setMenuOpen(false); }}>View Kalkulasi</button>
                <button type="button" className="w-full px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-50" onClick={() => { onSave(); setMenuOpen(false); }}>Simpan Draft</button>
                <button type="button" className="w-full px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-50" onClick={() => { onCommand(); setMenuOpen(false); }}>Menu Cepat (Ctrl+K)</button>
                <button type="button" className="w-full px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Tutup</button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
