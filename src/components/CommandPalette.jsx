import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText, TextField, Box, Typography } from '@mui/material';
import { Add, Save, ViewList, Build, DensityMedium, KeyboardCommandKey, Summarize, Calculate } from '@mui/icons-material';
import styled from '@emotion/styled';

const COMMANDS = [
  { id: 'load-meja', label: 'Load sample: Meja Belajar', action: 'loadSample', payload: 'meja-belajar', icon: ViewList },
  { id: 'load-lemari', label: 'Load sample: Lemari Pakaian', action: 'loadSample', payload: 'lemari', icon: ViewList },
  { id: 'add-meja', label: '+ Tambah template (hirarki lengkap)', action: 'addMeja', icon: Add },
  { id: 'add-modul', label: 'Tambah Produk Jadi (eCount)', action: 'addModul', icon: Add },
  { id: 'add-submodul', label: 'Tambah Sub Assembly', action: 'addSubModul', icon: Add },
  { id: 'add-part', label: 'Tambah Bahan Baku', action: 'addPart', icon: Add },
  { id: 'save', label: 'Simpan Draft', action: 'saveDraft', icon: Save },
  { id: 'view-kalkulasi', label: 'View Kalkulasi', action: 'viewKalkulasi', icon: Calculate },
  { id: 'tab-components', label: 'Beralih ke Components', action: 'switchTab', payload: 'components', icon: ViewList },
  { id: 'tab-operations', label: 'Beralih ke Operations', action: 'switchTab', payload: 'operations', icon: Build },
  { id: 'tab-miscellaneous', label: 'Beralih ke Miscellaneous', action: 'switchTab', payload: 'miscellaneous', icon: Summarize },
  { id: 'density-compact', label: 'Kepadatan: Compact', action: 'setDensity', payload: 'compact', icon: DensityMedium },
  { id: 'density-comfortable', label: 'Kepadatan: Comfortable', action: 'setDensity', payload: 'comfortable', icon: DensityMedium },
];

function fuzzyMatch(query, text) {
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

const StyledDialog = styled(Dialog)`
  & .MuiPaper-root {
    border-radius: 16px;
    box-shadow: 0 24px 48px rgba(0,0,0,0.12);
    overflow: hidden;
  }
`;

const SearchField = styled(TextField)`
  & .MuiOutlinedInput-root {
    border-radius: 12px;
    background: #f8fafc;
    font-family: var(--font-sans), sans-serif;
  }
`;

export function CommandPalette({ open, onClose, onCommand, activeTab, switchTab }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return COMMANDS;
    return COMMANDS.filter((c) => fuzzyMatch(query, c.label));
  }, [query]);

  const run = useCallback(
    (cmd) => {
      if (cmd.action === 'loadSample') onCommand('loadSample', cmd.payload);
      if (cmd.action === 'addMeja') onCommand('addMeja');
      if (cmd.action === 'addModul') onCommand('addModul');
      if (cmd.action === 'addSubModul') onCommand('addSubModul');
      if (cmd.action === 'addPart') onCommand('addPart');
      if (cmd.action === 'saveDraft') onCommand('saveDraft');
      if (cmd.action === 'viewKalkulasi') onCommand('viewKalkulasi');
      if (cmd.action === 'switchTab') switchTab(cmd.payload);
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
    setSelected((s) => Math.min(Math.max(0, s), filtered.length - 1));
  }, [filtered.length]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    }
    if (e.key === 'Enter' && filtered[selected]) {
      e.preventDefault();
      run(filtered[selected]);
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { fontFamily: 'var(--font-sans)' } }}>
      <DialogTitle sx={{ pb: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
        <KeyboardCommandKey color="primary" />
        <span>Aksi cepat</span>
        <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary', fontWeight: 500 }}>
          Ctrl+K
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <SearchField
          fullWidth
          size="small"
          placeholder="Ketik untuk mencari aksi…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          sx={{ mb: 1 }}
        />
        <List dense sx={{ maxHeight: 320, overflow: 'auto', py: 0 }}>
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            return (
              <ListItemButton
                key={cmd.id}
                selected={i === selected}
                onClick={() => run(cmd)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  fontFamily: 'var(--font-sans)',
                  '&.Mui-selected': { backgroundColor: 'action.selected' },
                }}
              >
                {Icon && <Icon sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary' }} />}
                <ListItemText primary={cmd.label} primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            );
          })}
        </List>
      </DialogContent>
    </StyledDialog>
  );
}
