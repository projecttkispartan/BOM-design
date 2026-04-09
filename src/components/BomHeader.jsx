import React, { useState } from 'react';
import { Box, Typography, Button, Menu, MenuItem, IconButton, Tooltip } from '@mui/material';
import { Settings, Save, Calculate, Undo, Redo } from '@mui/icons-material';
import styled from '@emotion/styled';

const Root = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: #0f172a;
  border-bottom: 1px solid rgba(255,255,255,0.1);
`;

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
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const hasChanges = changeCount > 0;

  return (
    <Root>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#e2e8f0', fontFamily: 'var(--font-sans)', fontSize: '1rem' }}>
        BoM
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {onUndo && (
          <Tooltip title="Undo (Ctrl+Z)">
            <span>
              <IconButton size="small" onClick={onUndo} disabled={!canUndo} sx={{ color: canUndo ? '#e2e8f0' : 'rgba(255,255,255,0.3)' }}>
                <Undo fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {onRedo && (
          <Tooltip title="Redo (Ctrl+Y)">
            <span>
              <IconButton size="small" onClick={onRedo} disabled={!canRedo} sx={{ color: canRedo ? '#e2e8f0' : 'rgba(255,255,255,0.3)' }}>
                <Redo fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Button
          variant="contained"
          size="small"
          startIcon={<Save />}
          onClick={onSave}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            bgcolor: hasChanges ? '#f59e0b' : '#22c55e',
            color: '#fff',
            animation: hasChanges ? 'pulse 2s ease-in-out infinite' : 'none',
            '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.85 } },
            '&:hover': { bgcolor: hasChanges ? '#d97706' : '#16a34a' },
          }}
        >
          {hasChanges ? `Simpan (${changeCount} perubahan)` : 'Simpan'}
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Calculate />}
          onClick={onViewKalkulasi}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            borderColor: 'rgba(255,255,255,0.35)',
            color: '#e2e8f0',
            '&:hover': { borderColor: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.08)' },
          }}
        >
          Hitung BOM
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Settings />}
          onClick={handleMenu}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            borderColor: 'rgba(255,255,255,0.3)',
            color: '#e2e8f0',
            '&:hover': { borderColor: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.08)' },
          }}
        >
          Pengaturan
        </Button>
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} PaperProps={{ sx: { bgcolor: '#1e293b', color: '#e2e8f0', minWidth: 220 } }}>
          <MenuItem onClick={() => { onAddProduk?.(); handleClose(); }}>Tambah Produk Jadi</MenuItem>
          <MenuItem onClick={() => { onAddSubAssembly?.(); handleClose(); }}>Tambah Sub Assembly</MenuItem>
          <MenuItem onClick={() => { onAddBahanBaku?.(); handleClose(); }}>Tambah Bahan Baku</MenuItem>
          <MenuItem onClick={() => { onViewKalkulasi?.(); handleClose(); }}>View Kalkulasi</MenuItem>
          <MenuItem onClick={() => { onSave?.(); handleClose(); }}>Simpan Draft</MenuItem>
          <MenuItem onClick={() => { onCommand?.(); handleClose(); }}>Menu Cepat (Ctrl+K)</MenuItem>
          <MenuItem onClick={handleClose}>Tutup</MenuItem>
        </Menu>
      </Box>
    </Root>
  );
}
