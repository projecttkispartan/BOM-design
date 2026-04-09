'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Copy,
  Filter,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { bomApiClient, type BomFilters, type BomListItem } from '@/lib/bomApiClient';
import { migrateLocalStorageToApi } from '@/lib/localMigration';

function fmtRp(n: number): string {
  if (!n) return 'Rp 0';
  return 'Rp ' + n.toLocaleString('id-ID');
}

function fmtDate(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function nextBomCode(items: BomListItem[]): string {
  const max = items.reduce((current, item) => {
    const match = item.code.match(/BOM-(\d+)/i);
    if (!match) return current;
    return Math.max(current, Number.parseInt(match[1], 10) || 0);
  }, 0);
  return `BOM-${String(max + 1).padStart(3, '0')}`;
}

type SortKey = 'name' | 'code' | 'productType' | 'status' | 'usedInWo' | 'expiryState' | 'needsReview' | 'grandTotal' | 'updatedAt';

export default function BomListPage() {
  const router = useRouter();
  const [items, setItems] = useState<BomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProductType, setFilterProductType] = useState('');
  const [filterExpiryState, setFilterExpiryState] = useState('');
  const [filterNeedsReview, setFilterNeedsReview] = useState(false);
  const [newBomOpen, setNewBomOpen] = useState(false);
  const [newBomName, setNewBomName] = useState('');
  const [newBomCode, setNewBomCode] = useState('');
  const [newBomNameError, setNewBomNameError] = useState('');
  const [woUsage, setWoUsage] = useState<Record<string, { count: number; loading: boolean }>>({});
  const [deleteTarget, setDeleteTarget] = useState<BomListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [slowLoading, setSlowLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const newBomRef = useRef<HTMLDivElement>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchList = useCallback(
    async (overrides: Partial<BomFilters> = {}) => {
      setLoading(true);
      setSlowLoading(false);
      setError(null);
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = setTimeout(() => setSlowLoading(true), 5000);
      try {
        const filters: BomFilters = {
          q: search.trim() || undefined,
          status: (filterStatus || undefined) as BomFilters['status'],
          productType: (filterProductType || undefined) as BomFilters['productType'],
          expiryState: (filterExpiryState || undefined) as BomFilters['expiryState'],
          needsReview: filterNeedsReview ? true : undefined,
          ...overrides,
        };
        const list = await bomApiClient.listBom(filters);
        setItems(list);
        setNewBomCode(nextBomCode(list));
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Gagal memuat data BOM');
      } finally {
        setLoading(false);
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }
      }
    },
    [filterExpiryState, filterNeedsReview, filterProductType, filterStatus, search],
  );

  useEffect(() => {
    const run = async () => {
      try {
        await migrateLocalStorageToApi();
      } catch {
        // Ignore migration failure, list fetch still proceeds.
      }
      await fetchList();
    };
    run();
  }, [fetchList]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchList();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchList, search, filterStatus, filterProductType, filterExpiryState, filterNeedsReview]);

  useEffect(
    () => () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!newBomOpen) return;
    const close = (event: MouseEvent) => {
      if (newBomRef.current && !newBomRef.current.contains(event.target as Node)) setNewBomOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [newBomOpen]);

  useEffect(() => {
    if (!items.length) return;
    const targets = items.slice(0, 25).filter((item) => !woUsage[item.id]);
    if (!targets.length) return;

    targets.forEach((item) => {
      setWoUsage((prev) => ({ ...prev, [item.id]: { count: prev[item.id]?.count ?? 0, loading: true } }));
      bomApiClient
        .getUsedInWo(item.id)
        .then((usage) => {
          setWoUsage((prev) => ({ ...prev, [item.id]: { count: usage.count, loading: false } }));
        })
        .catch(() => {
          setWoUsage((prev) => ({ ...prev, [item.id]: { count: 0, loading: false } }));
        });
    });
  }, [items, woUsage]);

  const stats = useMemo(() => {
    const totalCost = items.reduce((sum, item) => sum + item.costSummary.grandTotal, 0);
    const needsReview = items.filter((item) => item.needsReview.length > 0);
    const expiringCount = needsReview.filter((item) => item.needsReview.includes('expiring_30_days')).length;
    const staleCount = needsReview.filter((item) => item.needsReview.includes('not_revised_6_months')).length;
    const oldDraftCount = needsReview.filter((item) => item.needsReview.includes('draft_over_14_days')).length;
    return {
      totalBom: items.length,
      totalCost,
      reviewCount: needsReview.length,
      expiringCount,
      staleCount,
      oldDraftCount,
    };
  }, [items]);

  const sortedItems = useMemo(() => {
    const data = [...items];
    data.sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      const usageA = woUsage[a.id]?.count || 0;
      const usageB = woUsage[b.id]?.count || 0;
      const valueA: string | number = (() => {
        if (sortBy === 'name') return a.name.toLowerCase();
        if (sortBy === 'code') return a.code.toLowerCase();
        if (sortBy === 'productType') return a.productType.toLowerCase();
        if (sortBy === 'status') return a.status.toLowerCase();
        if (sortBy === 'usedInWo') return usageA;
        if (sortBy === 'expiryState') return a.expiryState.toLowerCase();
        if (sortBy === 'needsReview') return a.needsReview.length;
        if (sortBy === 'grandTotal') return a.costSummary.grandTotal;
        return a.updatedAt;
      })();
      const valueB: string | number = (() => {
        if (sortBy === 'name') return b.name.toLowerCase();
        if (sortBy === 'code') return b.code.toLowerCase();
        if (sortBy === 'productType') return b.productType.toLowerCase();
        if (sortBy === 'status') return b.status.toLowerCase();
        if (sortBy === 'usedInWo') return usageB;
        if (sortBy === 'expiryState') return b.expiryState.toLowerCase();
        if (sortBy === 'needsReview') return b.needsReview.length;
        if (sortBy === 'grandTotal') return b.costSummary.grandTotal;
        return b.updatedAt;
      })();
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return dir * (valueA - valueB);
      }
      return dir * String(valueA).localeCompare(String(valueB), undefined, { numeric: true });
    });
    return data;
  }, [items, sortBy, sortDirection, woUsage]);

  const toggleSort = useCallback((key: SortKey) => {
    setSortBy((prevKey) => {
      if (prevKey === key) {
        setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'));
        return prevKey;
      }
      setSortDirection(key === 'updatedAt' ? 'desc' : 'asc');
      return key;
    });
  }, []);

  const renderSortIcon = (key: SortKey) => {
    if (sortBy !== key) return <ArrowUpDown className="h-3 w-3 text-slate-400" />;
    if (sortDirection === 'asc') return <ArrowUp className="h-3 w-3 text-sky-600" />;
    return <ArrowDown className="h-3 w-3 text-sky-600" />;
  };

  const createBom = useCallback(async () => {
    const name = newBomName.trim();
    const code = (newBomCode || nextBomCode(items)).trim();
    if (name.length < 3) {
      setNewBomNameError('Nama produk wajib diisi minimal 3 karakter');
      return;
    }
    try {
      const created = await bomApiClient.createBom({
        code,
        name,
        metadata: {
          productCode: code,
          productName: name,
          productType: 'Standard',
          leadTime: '',
          effectiveDate: '',
          expiryDate: '',
        },
      });
      setNewBomOpen(false);
      setNewBomName('');
      setNewBomNameError('');
      router.push(`/bom/${created.id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Gagal membuat BOM');
    }
  }, [items, newBomCode, newBomName, router]);

  const duplicateBom = useCallback(
    async (item: BomListItem) => {
      try {
        const detail = await bomApiClient.getBom(item.id);
        const current = detail.versions.find((version) => version.id === detail.currentVersionId) || detail.versions[detail.versions.length - 1];
        if (!current) return;
        const duplicateCode = `${item.code}-COPY`;
        const duplicateName = `${item.name} (Copy)`;
        const created = await bomApiClient.createBom({
          code: duplicateCode,
          name: duplicateName,
          description: item.description || undefined,
          metadata: {
            ...current.metadata,
            productCode: duplicateCode,
            productName: duplicateName,
          },
          bomRows: current.bomRows,
          hardwareRows: current.hardwareRows,
          operations: current.operations,
          packingRows: current.packingRows,
          packingInfo: current.packingInfo,
        });
        router.push(`/bom/${created.id}`);
      } catch (duplicateError) {
        setError(duplicateError instanceof Error ? duplicateError.message : 'Gagal menduplikasi BOM');
      }
    },
    [router],
  );

  const requestDeleteBom = useCallback((item: BomListItem) => {
    setDeleteTarget(item);
  }, []);

  const confirmDeleteBom = useCallback(async () => {
    if (!deleteTarget) return;
    const usage = woUsage[deleteTarget.id]?.count || 0;
    const previousItems = items;
    const nextItems = items.filter((item) => item.id !== deleteTarget.id);
    setDeleting(true);
    setDeleteTarget(null);
    setItems(nextItems);
    setNewBomCode(nextBomCode(nextItems));
    setWoUsage((prev) => {
      const next = { ...prev };
      delete next[deleteTarget.id];
      return next;
    });
    try {
      await bomApiClient.deleteBom(deleteTarget.id, { force: usage > 0 });
      await fetchList();
    } catch (deleteError) {
      setItems(previousItems);
      setNewBomCode(nextBomCode(previousItems));
      setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus BOM');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchList, items, woUsage]);

  const hasActiveFilters = Boolean(filterStatus || filterProductType || filterExpiryState || filterNeedsReview);

  return (
    <div className="min-h-screen bg-surface text-slate-800 font-sans">
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Daftar Bill of Materials</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {process.env.NODE_ENV === 'development'
                ? 'Frontend-only (localStorage) sebagai source of truth'
                : 'Sistem Kalkulasi Bill of Materials - v1.0'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/settings/masters"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Wrench className="w-4 h-4" />
              Master Data
            </a>
            <div className="relative" ref={newBomRef}>
              <button
                type="button"
                onClick={() =>
                  setNewBomOpen((value) => {
                    const next = !value;
                    if (next) setNewBomNameError('');
                    return next;
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                BOM Baru
              </button>
              {newBomOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-xl z-30 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Buat BOM Baru</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newBomCode}
                      onChange={(event) => setNewBomCode(event.target.value)}
                      placeholder="Kode BOM"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newBomName}
                      onChange={(event) => {
                        setNewBomName(event.target.value);
                        if (newBomNameError) setNewBomNameError('');
                      }}
                      placeholder="Nama produk"
                      className={`w-full px-3 py-2 rounded-lg bg-white border text-slate-900 text-sm placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none ${
                        newBomNameError ? 'border-red-400' : 'border-slate-300'
                      }`}
                      autoFocus
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') createBom();
                      }}
                    />
                    {newBomNameError && <p className="text-[11px] text-red-600">{newBomNameError}</p>}
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setNewBomOpen(false);
                        setNewBomNameError('');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={createBom}
                      disabled={newBomName.trim().length < 3}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                    >
                      Buat
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {loading ? (
            <>
              {[1, 2, 3].map((key) => (
                <div key={key} className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 w-24 rounded bg-slate-200" />
                    <div className="h-7 w-20 rounded bg-slate-200" />
                    <div className="h-3 w-36 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                <p className="text-xs text-slate-500">Total BOM</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalBom}</p>
                <p className="text-xs text-slate-500 mt-1">Grand total: {fmtRp(stats.totalCost)}</p>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                <p className="text-xs text-slate-500">Butuh Review</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">{stats.reviewCount}</p>
                <p className="text-xs text-slate-500 mt-1">Filter `needsReview=true` tersedia</p>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <p className="text-xs font-semibold text-amber-900 uppercase">BOM Perlu Review</p>
                </div>
                <p className="text-xs text-amber-900">Expiring 30 hari: {stats.expiringCount}</p>
                <p className="text-xs text-amber-900">Belum revisi {'>'} 6 bulan: {stats.staleCount}</p>
                <p className="text-xs text-amber-900">Draft {'>'} 14 hari: {stats.oldDraftCount}</p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama / kode BOM..."
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen((value) => !value)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
              hasActiveFilters ? 'border-sky-400 bg-sky-50 text-sky-800' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {filterOpen && (
          <div className="flex flex-wrap gap-3 mb-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <FilterSelect
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: '', label: 'Semua' },
                { value: 'draft', label: 'Draft' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'approved', label: 'Approved' },
                { value: 'final', label: 'Final' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
            <FilterSelect
              label="Product Type"
              value={filterProductType}
              onChange={setFilterProductType}
              options={[
                { value: '', label: 'Semua' },
                { value: 'Standard', label: 'Standard' },
                { value: 'Custom', label: 'Custom' },
                { value: 'Export', label: 'Export' },
                { value: 'OEM', label: 'OEM' },
              ]}
            />
            <FilterSelect
              label="Expiry"
              value={filterExpiryState}
              onChange={setFilterExpiryState}
              options={[
                { value: '', label: 'Semua' },
                { value: 'active', label: 'Active' },
                { value: 'expiringSoon', label: 'Expiring Soon' },
                { value: 'expired', label: 'Expired' },
              ]}
            />
            <label className="inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={filterNeedsReview}
                onChange={(event) => setFilterNeedsReview(event.target.checked)}
                className="rounded border-slate-300"
              />
              Needs Review
            </label>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilterStatus('');
                  setFilterProductType('');
                  setFilterExpiryState('');
                  setFilterNeedsReview(false);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50"
              >
                <X className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <button type="button" onClick={() => toggleSort('name')} className="inline-flex items-center gap-1 hover:text-slate-700">
                    Nama BOM {renderSortIcon('name')}
                  </button>
                </th>
                <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <button type="button" onClick={() => toggleSort('code')} className="inline-flex items-center gap-1 hover:text-slate-700">
                    Kode {renderSortIcon('code')}
                  </button>
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <button type="button" onClick={() => toggleSort('productType')} className="inline-flex items-center gap-1 hover:text-slate-700">
                    Product Type {renderSortIcon('productType')}
                  </button>
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <button type="button" onClick={() => toggleSort('status')} className="inline-flex items-center gap-1 hover:text-slate-700">
                    Status {renderSortIcon('status')}
                  </button>
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <button type="button" onClick={() => toggleSort('usedInWo')} className="inline-flex items-center gap-1 hover:text-slate-700">
                    Used in WO {renderSortIcon('usedInWo')}
                  </button>
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <button type="button" onClick={() => toggleSort('expiryState')} className="inline-flex items-center gap-1 hover:text-slate-700">
                    Expiry {renderSortIcon('expiryState')}
                  </button>
                </th>
                <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <button type="button" onClick={() => toggleSort('needsReview')} className="inline-flex items-center gap-1 hover:text-slate-700">
                    Needs Review {renderSortIcon('needsReview')}
                  </button>
                </th>
                <th className="py-2.5 px-3 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <button type="button" onClick={() => toggleSort('grandTotal')} className="inline-flex items-center gap-1 hover:text-slate-700">
                    Grand Total {renderSortIcon('grandTotal')}
                  </button>
                </th>
                <th className="py-2.5 px-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <button type="button" onClick={() => toggleSort('updatedAt')} className="inline-flex items-center gap-1 hover:text-slate-700">
                    Updated {renderSortIcon('updatedAt')}
                  </button>
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && sortedItems.map((item) => {
                const usage = woUsage[item.id];
                const usageLabel = usage?.loading ? '...' : String(usage?.count ?? 0);
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => router.push(`/bom/${item.id}`)}
                        className="text-sm font-semibold text-slate-900 hover:text-sky-700 transition-colors text-left"
                      >
                        {item.name}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-600 font-mono">{item.code}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">{item.productType}</span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <StatusBadge status={item.status} size="xs" />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const detail = await bomApiClient.getUsedInWo(item.id);
                            const list = detail.items.map((wo) => `${wo.code} (${wo.status})`).join('\n');
                            alert(list ? `Used in ${detail.count} WO:\n${list}` : 'Tidak digunakan di WO');
                          } catch (usageError) {
                            setError(usageError instanceof Error ? usageError.message : 'Gagal memuat detail WO');
                          }
                        }}
                        className={`text-xs font-semibold ${Number(usageLabel) > 0 ? 'text-amber-700 hover:text-amber-900' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {usageLabel}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          item.expiryState === 'expired'
                            ? 'bg-red-100 text-red-800'
                            : item.expiryState === 'expiringSoon'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.expiryState}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-600">
                      {item.needsReview.length > 0 ? item.needsReview.join(', ') : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-xs font-semibold text-amber-700 tabular-nums">
                      {fmtRp(item.costSummary.grandTotal)}
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-500">{fmtDate(item.updatedAt)}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => duplicateBom(item)}
                          title="Duplikasi"
                          className="p-1.5 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDeleteBom(item)}
                          title="Hapus"
                          className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && sortedItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                    Tidak ada data BOM.
                  </td>
                </tr>
              )}
              {loading && (
                <>
                  {[1, 2, 3, 4].map((idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td colSpan={10} className="py-2 px-3">
                        <div className="animate-pulse h-6 rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))}
                  {slowLoading && (
                    <tr>
                      <td colSpan={10} className="py-3 text-center text-xs text-amber-700">
                        Memuat data lebih lama dari biasanya.
                        <button
                          type="button"
                          onClick={() => fetchList()}
                          className="ml-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
                        >
                          Coba Lagi
                        </button>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {deleteTarget && (
          <ConfirmDeleteModal
            item={deleteTarget}
            usageCount={woUsage[deleteTarget.id]?.count || 0}
            deleting={deleting}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={confirmDeleteBom}
          />
        )}
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
  item,
  usageCount,
  deleting,
  onCancel,
  onConfirm,
}: {
  item: BomListItem;
  usageCount: number;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/35" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-900">Konfirmasi Hapus BOM</h3>
        <p className="mt-2 text-xs text-slate-600">
          Anda akan menghapus <span className="font-semibold text-slate-900">{item.code} - {item.name}</span>.
        </p>
        {usageCount > 0 && (
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
            BOM dipakai di {usageCount} WO. Hapus tetap akan menggunakan force delete.
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-500 font-medium uppercase">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none appearance-none cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
