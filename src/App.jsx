import React, { useState, useCallback, useEffect } from 'react';
import { Box, Tabs, Tab, Snackbar, Alert, Paper, Typography } from '@mui/material';
import { message as antMessage } from 'antd';
import { useBom } from './context/BomContext';
import { useUndoRedo, useUnsavedChanges } from './hooks';
import { normalizeBomRow, SAMPLE_PRODUCTS } from './utils/initialState';
import { recomputeRow } from './utils/calculations';
import { BomHeader } from './components/BomHeader';
import { BomConfigHeader } from './components/BomConfigHeader';
import { ComponentsTable } from './components/ComponentsTable';
import { HardwareTable } from './components/HardwareTable';
import { CommandPalette } from './components/CommandPalette';
import { EmptyState } from './components/EmptyState';
import { KalkulasiDialog } from './components/KalkulasiDialog';

function App() {
  const {
    metadata,
    bomRows,
    hardwareRows,
    setMetadata,
    setBomRows,
    updateBomRow,
    removeBomRow,
    addModul,
    addSubModul,
    addPart,
    addMejaTemplate,
    getLastAddedPartId,
    updateHardwareRow,
    addHardwareRow,
    removeHardwareRow,
    setDensity,
    setHardwareRows,
    saveToStorage,
  } = useBom();

  const [activeTab, setActiveTab] = useState('components');
  const [commandOpen, setCommandOpen] = useState(false);
  const [kalkulasiOpen, setKalkulasiOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [newRowId, setNewRowId] = useState(null);

  const unsaved = useUnsavedChanges({ pageTitle: 'BoM' });
  const undoable = useUndoRedo(bomRows, setBomRows);

  const showToast = useCallback((msg, severity = 'success') => {
    setSnackbar({ open: true, message: msg, severity });
  }, []);

  const handleSave = useCallback(() => {
    const ok = saveToStorage();
    if (ok) unsaved.markSaved();
    showToast(ok ? 'Berhasil disimpan' : 'Gagal menyimpan', ok ? 'success' : 'error');
  }, [saveToStorage, unsaved, showToast]);

  const setMetadataWithDirty = useCallback(
    (meta) => {
      setMetadata(meta);
      unsaved.markChanged();
    },
    [setMetadata, unsaved]
  );

  const updateBomRowWithUndo = useCallback(
    (id, updates) => {
      unsaved.markChanged();
      undoable.execute((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const next = recomputeRow(normalizeBomRow({ ...r, ...updates }));
          return next;
        })
      );
    },
    [unsaved, undoable]
  );

  const removeBomRowWithUndo = useCallback(
    (id) => {
      unsaved.markChanged();
      undoable.execute((prev) => prev.filter((r) => r.id !== id));
    },
    [unsaved, undoable]
  );

  const handleAddModul = useCallback(() => {
    addModul();
    unsaved.markChanged();
    showToast('Modul ditambahkan');
  }, [addModul, unsaved, showToast]);

  const handleAddSubModul = useCallback(() => {
    const rows = bomRows.filter((r) => r.levelNum === 0);
    if (!rows.length) {
      antMessage.error('Tambah Produk Jadi dulu');
      return;
    }
    addSubModul();
    unsaved.markChanged();
    showToast('Sub Modul ditambahkan');
  }, [addSubModul, bomRows, unsaved, showToast]);

  const handleAddPart = useCallback(() => {
    const hasParent = bomRows.some((r) => r.levelNum === 0 || r.levelNum === 1);
    if (!hasParent) {
      antMessage.error('Tambah Produk Jadi atau Sub Assembly dulu');
      return;
    }
    addPart();
    const id = getLastAddedPartId?.();
    if (id) {
      setNewRowId(id);
      setTimeout(() => setNewRowId(null), 1500);
    }
    unsaved.markChanged();
    showToast('Part ditambahkan');
  }, [addPart, getLastAddedPartId, bomRows, unsaved, showToast]);

  const handleAddMeja = useCallback(() => {
    addMejaTemplate?.();
    unsaved.markChanged();
    showToast('Meja Belajar (Modul + Submodul + Part) ditambahkan');
  }, [addMejaTemplate, unsaved, showToast]);

  const updateHardwareRowWithDirty = useCallback(
    (id, updates) => {
      updateHardwareRow?.(id, updates);
      unsaved.markChanged();
    },
    [updateHardwareRow, unsaved]
  );

  const handleAddHardwareRow = useCallback(() => {
    addHardwareRow?.();
    unsaved.markChanged();
    showToast('Baris hardware ditambahkan');
  }, [addHardwareRow, unsaved, showToast]);

  const removeHardwareRowWithDirty = useCallback(
    (id) => {
      removeHardwareRow?.(id);
      unsaved.markChanged();
    },
    [removeHardwareRow, unsaved]
  );

  const handleCommand = useCallback(
    (action, payload) => {
      if (action === 'addModul') handleAddModul();
      if (action === 'addSubModul') handleAddSubModul();
      if (action === 'addPart') handleAddPart();
      if (action === 'addMeja') handleAddMeja();
      if (action === 'loadSample' && payload) handleLoadSample(payload);
      if (action === 'saveDraft') handleSave();
      if (action === 'viewKalkulasi') setKalkulasiOpen(true);
      if (action === 'setDensity' && payload) {
        setDensity(payload);
        showToast(`Kepadatan: ${payload}`);
      }
    },
    [handleAddModul, handleAddSubModul, handleAddPart, handleAddMeja, handleLoadSample, handleSave, setDensity, showToast]
  );

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'F8') {
        e.preventDefault();
        handleSave();
      }
      const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.getAttribute('contenteditable') === 'true';
      if (!isInputFocused && (e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) undoable.redo();
        else undoable.undo();
      }
      if (!isInputFocused && (e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        undoable.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave, undoable]);

  const hasBom = bomRows.length > 0;
  const hasHardware = hardwareRows.length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh', fontFamily: 'var(--font-sans)', bgcolor: '#0f172a', color: '#e2e8f0' }}>
      <BomHeader
        onSave={handleSave}
        onCommand={() => setCommandOpen(true)}
        onViewKalkulasi={() => setKalkulasiOpen(true)}
        onAddProduk={handleAddModul}
        onAddSubAssembly={handleAddSubModul}
        onAddBahanBaku={handleAddPart}
        changeCount={unsaved.changeCount}
        onUndo={undoable.undo}
        onRedo={undoable.redo}
        canUndo={undoable.canUndo}
        canRedo={undoable.canRedo}
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <BomConfigHeader
          metadata={metadata}
          onChange={setMetadataWithDirty}
          onSave={handleSave}
          onHitungBom={() => setKalkulasiOpen(true)}
        />

        <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, borderRadius: 0, bgcolor: '#1e293b', overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              borderBottom: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              px: 2,
              minHeight: 48,
              bgcolor: 'transparent',
              '& .MuiTab-root': { minHeight: 48, fontWeight: 600, textTransform: 'none', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' },
              '& .Mui-selected': { color: '#fff' },
              '& .MuiTabs-indicator': { height: 3, bgcolor: '#38bdf8' },
            }}
          >
            <Tab label="Components" value="components" />
            <Tab label="Operations (Soon)" value="operations" />
            <Tab label="Miscellaneous" value="miscellaneous" />
          </Tabs>

          <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', bgcolor: '#1e293b', color: '#e2e8f0' }}>
            {activeTab === 'components' && (
              <Box sx={{ px: 0, py: 0 }}>
                <ComponentsTable
                  bomRows={bomRows}
                  updateBomRow={updateBomRowWithUndo}
                  removeBomRow={removeBomRowWithUndo}
                  onAddLine={handleAddPart}
                  onAddMeja={handleAddMeja}
                  onCatalog={() => showToast('Catalog — coming soon', 'info')}
                  newRowId={newRowId}
                />
              </Box>
            )}
            {activeTab === 'operations' && (
              <Box sx={{ p: 4, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                <Typography variant="body1">Fitur Operations (routing & work center) segera hadir.</Typography>
              </Box>
            )}
            {activeTab === 'miscellaneous' && (
              <Box sx={{ p: 2.5 }}>
                <HardwareTable
                  hardwareRows={hardwareRows}
                  updateHardwareRow={updateHardwareRowWithDirty}
                  addHardwareRow={handleAddHardwareRow}
                  removeHardwareRow={removeHardwareRowWithDirty}
                />
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onCommand={handleCommand}
        activeTab={activeTab}
        switchTab={setActiveTab}
      />

      <KalkulasiDialog open={kalkulasiOpen} onClose={() => setKalkulasiOpen(false)} bomRows={bomRows} />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ fontFamily: 'var(--font-sans)', boxShadow: 2, borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
