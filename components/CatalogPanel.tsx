'use client';

import { useState, useMemo } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { CATALOG_ITEMS, CATALOG_CATEGORIES } from '@/lib/catalogData';
import type { CatalogItem } from '@/types';

interface CatalogPanelProps {
  open: boolean;
  onClose: () => void;
  onAddToBom: (item: CatalogItem) => void;
}

export function CatalogPanel({ open, onClose, onAddToBom }: CatalogPanelProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');

  const filtered = useMemo(() => {
    return CATALOG_ITEMS.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'Semua' || item.category === category;
      return matchSearch && matchCat;
    });
  }, [search, category]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="shrink-0 border-b border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Katalog Material</h3>
              <p className="text-xs text-slate-500 mt-0.5">Pilih material atau hardware untuk ditambahkan ke BOM</p>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama material..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-visible">
            {CATALOG_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  category === cat
                    ? 'bg-sky-100 text-sky-800 shadow-sm ring-1 ring-sky-300'
                    : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-50/50 scrollbar-visible">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map((item) => (
              <div key={item.code} className="p-3 bg-white rounded-xl border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all group flex flex-col">
                <div className="flex-1 min-w-0 mb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-bold text-slate-900 leading-tight">{item.name}</div>
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">{item.code}</div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                  <div className="text-sm font-black text-amber-700">
                    Rp {item.price.toLocaleString('id-ID')} <span className="text-[10px] font-medium text-slate-400">/ {item.unit}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddToBom(item)}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 font-semibold text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-sky-600 hover:text-white shadow-sm"
                    title="Tambah ke BOM"
                  >
                    <Plus className="w-3.5 h-3.5" /> Pilih
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Tidak ada material yang cocok dengan pencarian Anda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
