'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBom } from '@/context/BomContext';
import { MasterDataProvider } from '@/context/MasterDataContext';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { normalizeBomRow } from '@/lib/normalizeBomRow';
import { recomputeRow } from '@/lib/calculations';
import { SAMPLE_PRODUCTS, defaultPackingInfo } from '@/lib/initialState';
import { validateBomForSave } from '@/lib/bomValidation';
import { getLocalStoragePressure } from '@/lib/storageHealth';
import type { BomRow, BomMetadata, CatalogItem } from '@/types';
import { BomConfigHeader } from '@/components/BomConfigHeader';
import { ComponentsTable } from '@/components/ComponentsTable';
import { HardwareTable } from '@/components/HardwareTable';
import { CommandPalette } from '@/components/CommandPalette';
import { KalkulasiDialog } from '@/components/KalkulasiDialog';
import { DetailDrawer } from '@/components/DetailDrawer';
import { CatalogPanel } from '@/components/CatalogPanel';
import { OperationsTable } from '@/components/OperationsTable';
import { PackingTable } from '@/components/PackingTable';
import { CalculationScenarioView } from '@/components/CalculationScenarioView';
import { VersionBar } from '@/components/VersionBar';
import { VersionDiffModal } from '@/components/VersionDiffModal';
import { StatusBadge } from '@/components/StatusBadge';
import {
  bomApiClient,
  type BomDocumentDetail,
  type BomVersionDetail,
  type StockStatusResponse,
} from '@/lib/bomApiClient';
import { migrateLocalStorageToApi } from '@/lib/localMigration';

interface UndoState {
  bomRows: BomRow[];
  metadata: BomMetadata;
}

function undoStateEqual(a: UndoState, b: UndoState): boolean {
  return a.bomRows === b.bomRows && a.metadata === b.metadata;
}

function getClientRole(): string {
  if (typeof window === 'undefined') return 'engineering';
  return localStorage.getItem('bom.user.role') || 'engineering';
}

function getClientUserId(): string {
  if (typeof window === 'undefined') return 'ui-user';
  return localStorage.getItem('bom.user.id') || localStorage.getItem('bom.user.email') || 'ui-user';
}

function canReview(role: string): boolean {
  return role === 'owner' || role === 'supervisor';
}

function downloadBase64File(file: { name: string; mimeType: string; contentBase64: string }) {
  const binary = window.atob(file.contentBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const blob = new Blob([bytes], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function BomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;
  const {
    metadata,
    bomRows,
    hardwareRows,
    operations,
    setMetadata,
    setBomRows,
    updateBomRow,
    addModul,
    addSubModul,
    addPart,
    addOperation,
    addChildUnder,
    addRowAbove,
    addMejaTemplate,
    updateHardwareRow,
    addHardwareRow,
    removeHardwareRow,
    setHardwareRows,
    setOperations,
    recalculateAll,
    packingRows,
    packingInfo,
    setPackingRows,
    setPackingInfo,
  } = useBom();

  const [document, setDocument] = useState<BomDocumentDetail | null>(null);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('components');
  const [commandOpen, setCommandOpen] = useState(false);
  const [kalkulasiOpen, setKalkulasiOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<BomRow | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stockStatus, setStockStatus] = useState<StockStatusResponse | null>(null);
  const [selectedStockPart, setSelectedStockPart] = useState<StockStatusResponse['components'][number] | null>(null);
  const [usedInWoCount, setUsedInWoCount] = useState(0);
  const [role, setRole] = useState('engineering');
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [saveValidationToken, setSaveValidationToken] = useState(0);
  const storageWarnedRef = useRef(false);

  const unsaved = useUnsavedChanges({ pageTitle: 'BoM' });
  const currentUndoState = useMemo<UndoState>(() => ({ bomRows, metadata }), [bomRows, metadata]);
  const applyUndoState = useCallback((state: UndoState) => {
    setBomRows(state.bomRows);
    setMetadata(state.metadata);
  }, [setBomRows, setMetadata]);
  const undoable = useUndoRedo<UndoState>(currentUndoState, applyUndoState, undoStateEqual);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string, severity: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ open: true, message, severity });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((value) => ({ ...value, open: false })), 3200);
  }, []);

  const checkStoragePressure = useCallback(() => {
    if (storageWarnedRef.current) return;
    const pressure = getLocalStoragePressure();
    if (!pressure || !pressure.isHigh) return;
    storageWarnedRef.current = true;
    showToast(
      `Penyimpanan browser terpakai ${pressure.usagePercent}%. Disarankan export dan bersihkan data lama.`,
      'warning',
    );
  }, [showToast]);

  const currentVersion = useMemo(() => {
    if (!document) return null;
    return document.versions.find((version) => version.id === currentVersionId) || document.versions[document.versions.length - 1] || null;
  }, [currentVersionId, document]);

  const stockByPartCode = useMemo(() => {
    const map = new Map<string, StockStatusResponse['components'][number]>();
    stockStatus?.components.forEach((item) => map.set(item.partCode, item));
    return map;
  }, [stockStatus]);

  const applyVersionState = useCallback(
    (version: BomVersionDetail) => {
      setMetadata({ ...version.metadata });
      setBomRows(version.bomRows.map((row) => recomputeRow(normalizeBomRow(row))));
      setHardwareRows(version.hardwareRows.map((row) => ({ ...row })));
      setOperations(version.operations.map((row) => ({ ...row })));
      setPackingRows(version.packingRows.map((row) => ({ ...row })));
      setPackingInfo(version.packingInfo ? { ...version.packingInfo } : { ...defaultPackingInfo });
      setIsReadOnly(version.isImmutable || version.status === 'final' || version.status === 'archived');
    },
    [setBomRows, setHardwareRows, setMetadata, setOperations, setPackingInfo, setPackingRows],
  );

  const loadDocument = useCallback(async () => {
    setLoading(true);
    try {
      await migrateLocalStorageToApi().catch(() => undefined);
      const detail = await bomApiClient.getBom(docId);
      setDocument(detail);
      const selected = detail.versions.find((version) => version.id === detail.currentVersionId) || detail.versions[detail.versions.length - 1];
      if (!selected) throw new Error('Versi BOM tidak ditemukan');
      setCurrentVersionId(selected.id);
      applyVersionState(selected);

      const usage = await bomApiClient.getUsedInWo(docId).catch(() => ({ count: 0 }));
      setUsedInWoCount(usage.count || 0);
      setRole(getClientRole());
      checkStoragePressure();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal memuat BOM', 'error');
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [applyVersionState, checkStoragePressure, docId, router, showToast]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const refreshStockStatus = useCallback(async () => {
    if (!document) return;
    try {
      const stock = await bomApiClient.getStockStatus(document.id);
      setStockStatus(stock);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal memuat stock status', 'warning');
    }
  }, [document, showToast]);

  useEffect(() => {
    if (activeTab === 'components' && document) {
      refreshStockStatus();
    }
  }, [activeTab, currentVersionId, document, refreshStockStatus]);

  const saveCurrent = useCallback(async () => {
    if (!document || !currentVersion) return;
    if (isReadOnly) {
      showToast('Versi ini immutable/read-only', 'warning');
      return;
    }
    setSaveValidationToken((value) => value + 1);
    const validation = validateBomForSave({
      metadata,
      bomRows,
      packingRows,
      packingInfo,
    });
    if (!validation.valid) {
      showToast(validation.issues[0]?.message || 'Data BOM belum valid', 'warning');
      return;
    }
    if (usedInWoCount > 0) {
      const proceed = window.confirm(`BOM ini dipakai di ${usedInWoCount} Work Order. Lanjut simpan perubahan?`);
      if (!proceed) return;
    }
    try {
      const updated = await bomApiClient.updateBom(document.id, {
        metadata,
        bomRows,
        hardwareRows,
        operations,
        packingRows,
        packingInfo,
      });
      setDocument((prev) => {
        if (!prev) return prev;
        const nextVersions = prev.versions.map((version) => (version.id === updated.id ? updated : version));
        return { ...prev, versions: nextVersions, updatedAt: new Date().toISOString() };
      });
      setCurrentVersionId(updated.id);
      applyVersionState(updated);
      unsaved.markSaved();
      setLastSaved(new Date());
      checkStoragePressure();
      showToast('BOM berhasil disimpan');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal menyimpan BOM', 'error');
    }
  }, [
    applyVersionState,
    bomRows,
    currentVersion,
    document,
    hardwareRows,
    isReadOnly,
    metadata,
    operations,
    packingInfo,
    packingRows,
    checkStoragePressure,
    showToast,
    unsaved,
    usedInWoCount,
  ]);

  const reloadAfterWorkflow = useCallback(async () => {
    const detail = await bomApiClient.getBom(docId);
    setDocument(detail);
    const selected = detail.versions.find((version) => version.id === detail.currentVersionId) || detail.versions[detail.versions.length - 1];
    if (selected) {
      setCurrentVersionId(selected.id);
      applyVersionState(selected);
    }
  }, [applyVersionState, docId]);

  const handleSubmitReview = useCallback(async () => {
    if (!document) return;
    try {
      await saveCurrent();
      await bomApiClient.submitReview(document.id);
      await reloadAfterWorkflow();
      showToast('Draft berhasil disubmit untuk review');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal submit review', 'error');
    }
  }, [document, reloadAfterWorkflow, saveCurrent, showToast]);

  const handleApprove = useCallback(async () => {
    if (!document) return;
    try {
      await bomApiClient.approve(document.id);
      await reloadAfterWorkflow();
      showToast('BOM berhasil di-approve');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal approve', 'error');
    }
  }, [document, reloadAfterWorkflow, showToast]);

  const handleReject = useCallback(async () => {
    if (!document) return;
    const comment = window.prompt('Alasan reject (wajib):', '');
    if (!comment || !comment.trim()) return;
    try {
      await bomApiClient.reject(document.id, comment.trim());
      await reloadAfterWorkflow();
      showToast('BOM direject dan kembali ke draft', 'warning');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal reject', 'error');
    }
  }, [document, reloadAfterWorkflow, showToast]);

  const handleFinalize = useCallback(async () => {
    if (!document) return;
    const validation = validateBomForSave({
      metadata,
      bomRows,
      packingRows,
      packingInfo,
    });
    if (!validation.valid) {
      showToast(validation.issues[0]?.message || 'Data BOM belum valid untuk finalisasi', 'warning');
      return;
    }
    try {
      await bomApiClient.finalize(document.id);
      await reloadAfterWorkflow();
      showToast('BOM berhasil difinalisasi');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal finalize', 'error');
    }
  }, [bomRows, document, metadata, packingInfo, packingRows, reloadAfterWorkflow, showToast]);

  const handleExport = useCallback(async () => {
    if (!document) return;
    const formatRaw = window.prompt('Format export: pdf | excel | both', 'both');
    if (!formatRaw) return;
    const format = formatRaw.trim().toLowerCase();
    if (format !== 'pdf' && format !== 'excel' && format !== 'both') {
      showToast('Format export tidak valid', 'warning');
      return;
    }
    try {
      const result = await bomApiClient.exportBom(document.id, format);
      result.files.forEach(downloadBase64File);
      showToast(`Export selesai (${result.files.length} file)`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal export', 'error');
    }
  }, [document, showToast]);

  const setMetadataWithUndo = useCallback(
    (meta: Partial<BomMetadata>) => {
      if (isReadOnly) return;
      unsaved.markChanged();
      undoable.execute((previous) => ({ ...previous, metadata: { ...previous.metadata, ...meta } }));
    },
    [isReadOnly, undoable, unsaved],
  );

  const updateBomRowWithUndo = useCallback(
    (id: string, updates: Partial<BomRow>) => {
      unsaved.markChanged();
      undoable.execute((previous) => ({
        ...previous,
        bomRows: previous.bomRows.map((row) => {
          if (row.id !== id) return row;
          return recomputeRow(normalizeBomRow({ ...row, ...updates } as Partial<BomRow> & { id: string }));
        }),
      }));
    },
    [undoable, unsaved],
  );

  const removeBomRowWithUndo = useCallback(
    (id: string) => {
      if (isReadOnly) return;
      if (usedInWoCount > 0) {
        const proceed = window.confirm(`BOM ini sudah dipakai WO (${usedInWoCount}). Tetap hapus komponen?`);
        if (!proceed) return;
      }
      unsaved.markChanged();
      undoable.execute((previous) => ({
        ...previous,
        bomRows: previous.bomRows.filter((row) => row.id !== id).map((row, index) => ({ ...row, no: index + 1 })),
      }));
    },
    [isReadOnly, undoable, unsaved, usedInWoCount],
  );

  const handleSelectVersion = useCallback(
    (versionId: string) => {
      if (!document) return;
      const selected = document.versions.find((version) => version.id === versionId || version.versionId === versionId);
      if (!selected) return;
      setCurrentVersionId(selected.id);
      applyVersionState(selected);
      showToast(`Menampilkan versi ${selected.version}`);
    },
    [applyVersionState, document, showToast],
  );

  const handleCreateVersion = useCallback(async () => {
    if (!document) return;
    try {
      const created = await bomApiClient.createVersion(document.id, {
        status: 'draft',
        metadata,
        bomRows,
        hardwareRows,
        operations,
        packingRows,
        packingInfo,
      });
      setDocument((prev) => (prev ? { ...prev, currentVersionId: created.id, versions: [...prev.versions, created] } : prev));
      setCurrentVersionId(created.id);
      applyVersionState(created);
      showToast(`Versi ${created.version} dibuat`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal membuat versi baru', 'error');
    }
  }, [applyVersionState, bomRows, document, hardwareRows, metadata, operations, packingInfo, packingRows, showToast]);

  const updateHardwareRowWithDirty = useCallback((id: string, updates: Parameters<typeof updateHardwareRow>[1]) => {
    if (isReadOnly) return;
    updateHardwareRow(id, updates);
    unsaved.markChanged();
  }, [isReadOnly, unsaved, updateHardwareRow]);

  const handleAddHardwareRow = useCallback(() => {
    if (isReadOnly) return;
    addHardwareRow();
    unsaved.markChanged();
    showToast('Hardware ditambahkan');
  }, [addHardwareRow, isReadOnly, showToast, unsaved]);

  const removeHardwareRowWithDirty = useCallback((id: string) => {
    if (isReadOnly) return;
    if (usedInWoCount > 0) {
      const proceed = window.confirm(`BOM dipakai WO (${usedInWoCount}). Tetap hapus hardware?`);
      if (!proceed) return;
    }
    removeHardwareRow(id);
    unsaved.markChanged();
  }, [isReadOnly, removeHardwareRow, unsaved, usedInWoCount]);

  const handleCommand = useCallback(
    (action: string, payload?: string) => {
      if (action === 'addModul' && !isReadOnly) { addModul(); unsaved.markChanged(); }
      if (action === 'addSubModul' && !isReadOnly) { addSubModul(); unsaved.markChanged(); }
      if (action === 'addPart' && !isReadOnly) { addPart(); unsaved.markChanged(); }
      if (action === 'addMeja' && !isReadOnly) { addMejaTemplate(); unsaved.markChanged(); }
      if (action === 'loadSample' && payload && !isReadOnly) {
        const sample = SAMPLE_PRODUCTS.find((item) => item.id === payload);
        if (sample) {
          setMetadata({ ...sample.metadata });
          setBomRows(sample.bomRows.map((row) => ({ ...row })));
          setHardwareRows(sample.hardwareRows.map((row) => ({ ...row })));
          if (sample.operations) setOperations(sample.operations.map((row) => ({ ...row })));
          unsaved.markChanged();
        }
      }
      if (action === 'saveDraft') saveCurrent();
      if (action === 'viewKalkulasi') setKalkulasiOpen(true);
    },
    [addMejaTemplate, addModul, addPart, addSubModul, isReadOnly, saveCurrent, setBomRows, setHardwareRows, setMetadata, setOperations, unsaved],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveCurrent();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undoable.undo();
      }
      if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        undoable.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveCurrent, undoable]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (unsaved.isDirty && !isReadOnly && usedInWoCount === 0) saveCurrent();
    }, 120_000);
    return () => clearInterval(interval);
  }, [isReadOnly, saveCurrent, unsaved.isDirty, usedInWoCount]);

  if (loading || !document || !currentVersion) {
    return <div className="flex items-center justify-center h-screen bg-surface text-slate-500">Memuat...</div>;
  }

  const reviewerRole = canReview(role);
  const canSubmit = currentVersion.status === 'draft' && !isReadOnly;
  const canApproveReject = currentVersion.status === 'submitted' && reviewerRole;
  const canFinalize = currentVersion.status === 'approved' && reviewerRole;
  const canExport = currentVersion.status === 'final';
  const lastSavedLabel = lastSaved
    ? `Tersimpan ${lastSaved.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
    : null;

  return (
    <MasterDataProvider>
      <div className="flex flex-col h-full min-h-screen bg-surface text-slate-800 font-sans">
        <div className="flex items-center justify-between px-5 py-2 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <a href="/" className="text-slate-500 hover:text-slate-800 text-xs transition-colors">
              ← Daftar BOM
            </a>
            <div className="w-px h-4 bg-slate-200" />
            <span className="text-sm font-semibold text-slate-900">
              [{document.code}] {document.name}
            </span>
            <StatusBadge status={currentVersion.status} size="sm" />
            {isReadOnly && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium border border-red-200">
                Read Only
              </span>
            )}
            {usedInWoCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium border border-amber-200">
                Used in WO: {usedInWoCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={role}
              onChange={(event) => {
                const nextRole = event.target.value;
                setRole(nextRole);
                localStorage.setItem('bom.user.role', nextRole);
                localStorage.setItem('bom.user.id', getClientUserId());
              }}
              className="px-2 py-1 rounded border border-slate-300 text-[11px] text-slate-700"
              title="Role simulasi RBAC"
            >
              <option value="engineering">engineering</option>
              <option value="ppic">ppic</option>
              <option value="procurement">procurement</option>
              <option value="supervisor">supervisor</option>
              <option value="owner">owner</option>
            </select>
            {canSubmit && (
              <button
                type="button"
                onClick={handleSubmitReview}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-900 border border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                Submit for Review
              </button>
            )}
            {canApproveReject && (
              <>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-900 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-900 border border-red-300 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  Reject
                </button>
              </>
            )}
            {canFinalize && (
              <button
                type="button"
                onClick={handleFinalize}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-900 border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                Finalize
              </button>
            )}
            {canExport && (
              <button
                type="button"
                onClick={handleExport}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-sky-900 border border-sky-300 bg-sky-50 hover:bg-sky-100 transition-colors"
              >
                Export
              </button>
            )}
            {(currentVersion.status === 'final' || currentVersion.status === 'archived') && (
              <button
                type="button"
                onClick={handleCreateVersion}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-sky-800 border border-sky-300 bg-sky-50 hover:bg-sky-100 transition-colors"
              >
                + Versi Baru (Draft)
              </button>
            )}
            <button
              type="button"
              onClick={undoable.undo}
              disabled={!undoable.canUndo}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 transition-colors text-xs"
            >
              ←
            </button>
            <button
              type="button"
              onClick={undoable.redo}
              disabled={!undoable.canRedo}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 transition-colors text-xs"
            >
              →
            </button>
            <button
              type="button"
              onClick={saveCurrent}
              disabled={isReadOnly}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Simpan
            </button>
            {lastSavedLabel && <span className="text-[10px] text-slate-400">{lastSavedLabel}</span>}
          </div>
        </div>

        <VersionBar
          versions={document.versions}
          currentVersionId={currentVersion.id}
          bomName={document.name}
          onSelectVersion={handleSelectVersion}
          onCreateVersion={handleCreateVersion}
          onCompareVersions={() => setDiffOpen(true)}
          lastSavedLabel={lastSavedLabel}
        />

        <div className="flex-1 flex flex-col min-h-0">
          <BomConfigHeader
            metadata={metadata}
            onChange={setMetadataWithUndo}
            onHitungBom={() => setKalkulasiOpen(true)}
            saveValidationToken={saveValidationToken}
          />
          <div className="flex-1 flex flex-col min-h-0 bg-white border-t border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
              {['components', 'operations', 'packing', 'miscellaneous', 'scenario'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
                    activeTab === tab ? 'text-sky-700 border-b-2 border-sky-600 bg-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'packing' ? 'Packing' : tab === 'scenario' ? 'Scenario Kalkulasi' : tab}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col bg-white text-slate-800">
              {activeTab === 'components' && (
                <ComponentsTable
                  currency={metadata.currency ?? 'IDR'}
                  bomInputMode={metadata.bomInputMode ?? 'auto'}
                  bomRows={bomRows}
                  hardwareRows={hardwareRows}
                  packingRows={packingRows}
                  proses={metadata.proses ?? ''}
                  updateBomRow={updateBomRowWithUndo}
                  onChangeProses={(value) => setMetadataWithUndo({ proses: value })}
                  removeBomRow={removeBomRowWithUndo}
                  onAddLine={() => { if (!isReadOnly) { addPart(); unsaved.markChanged(); } }}
                  onAddMeja={() => { if (!isReadOnly) { addMejaTemplate(); unsaved.markChanged(); } }}
                  onAddModul={() => { if (!isReadOnly) { addModul(); unsaved.markChanged(); } }}
                  onAddSubModul={() => { if (!isReadOnly) { addSubModul(); unsaved.markChanged(); } }}
                  onAddOperation={() => { if (!isReadOnly) { addOperation(); unsaved.markChanged(); } }}
                  onAddChildUnder={(parentId) => {
                    if (isReadOnly) return '';
                    unsaved.markChanged();
                    return addChildUnder(parentId);
                  }}
                  onAddRowAbove={(targetRowId) => {
                    if (isReadOnly) return '';
                    unsaved.markChanged();
                    return addRowAbove(targetRowId);
                  }}
                  onOpenCatalog={() => setCatalogOpen(true)}
                  onOpenDetail={setDetailRow}
                  onRecalculate={() => { recalculateAll(); unsaved.markChanged(); }}
                  stockByPartCode={stockByPartCode}
                  onStockClick={(partCode) => setSelectedStockPart(stockByPartCode.get(partCode) || null)}
                  warnUsedInWo={usedInWoCount > 0}
                  isReadOnly={isReadOnly}
                />
              )}
              {activeTab === 'operations' && (
                <OperationsTable
                  operations={operations}
                  onUpdate={(rows) => {
                    if (isReadOnly) return;
                    setOperations(rows);
                    unsaved.markChanged();
                  }}
                />
              )}
              {activeTab === 'packing' && (
                <PackingTable
                  packingRows={packingRows}
                  packingInfo={packingInfo}
                  onUpdateRows={(rows) => {
                    if (isReadOnly) return;
                    setPackingRows(rows);
                    unsaved.markChanged();
                  }}
                  onUpdateInfo={(info) => {
                    if (isReadOnly) return;
                    setPackingInfo(info);
                    unsaved.markChanged();
                  }}
                  isReadOnly={isReadOnly}
                />
              )}
              {activeTab === 'miscellaneous' && (
                <div className="p-4 overflow-y-auto">
                  <HardwareTable
                    hardwareRows={hardwareRows}
                    updateHardwareRow={updateHardwareRowWithDirty}
                    addHardwareRow={handleAddHardwareRow}
                    removeHardwareRow={removeHardwareRowWithDirty}
                  />
                </div>
              )}
              {activeTab === 'scenario' && (
                <CalculationScenarioView
                  metadata={metadata}
                  bomRows={bomRows}
                  hardwareRows={hardwareRows}
                  packingRows={packingRows}
                />
              )}
            </div>
          </div>
        </div>

        <CommandPalette
          open={commandOpen}
          onClose={() => setCommandOpen(false)}
          onCommand={handleCommand}
          activeTab={activeTab}
          switchTab={setActiveTab}
        />
        <KalkulasiDialog
          open={kalkulasiOpen}
          onClose={() => setKalkulasiOpen(false)}
          bomRows={bomRows}
          hardwareRows={hardwareRows}
          packingRows={packingRows}
        />
        <DetailDrawer
          row={detailRow}
          allRows={bomRows}
          onClose={() => setDetailRow(null)}
          onUpdate={updateBomRowWithUndo}
          bomInputMode={metadata.bomInputMode ?? 'auto'}
        />
        <CatalogPanel
          open={catalogOpen}
          onClose={() => setCatalogOpen(false)}
          onAddToBom={(item: CatalogItem) => {
            if (isReadOnly) return;
            addPart({
              partCode: item.code,
              description: item.name,
              material: item.material,
              biayaSatuan: String(item.price),
            });
            unsaved.markChanged();
            setCatalogOpen(false);
          }}
        />
        <VersionDiffModal open={diffOpen} onClose={() => setDiffOpen(false)} versions={document.versions} />
        {selectedStockPart && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setSelectedStockPart(null)} />
            <div className="relative w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">{selectedStockPart.partCode}</h3>
              <p className="text-xs text-slate-500 mb-3">
                Required: {selectedStockPart.qtyRequired.toFixed(2)} | Available: {selectedStockPart.qtyAvailable.toFixed(2)}
              </p>
              <div className="space-y-1.5 max-h-56 overflow-auto">
                {selectedStockPart.warehouses.map((warehouse) => (
                  <div
                    key={warehouse.warehouseId}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  >
                    <span className="text-slate-700">{warehouse.warehouseName}</span>
                    <span className="font-semibold text-slate-900">{warehouse.qtyAvailable.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {toast.open && (
          <div
            className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.severity === 'error'
                ? 'bg-red-600 text-white'
                : toast.severity === 'warning'
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </MasterDataProvider>
  );
}
