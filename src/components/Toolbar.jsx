import React from 'react';
import { AppBar, Toolbar as MuiToolbar, Typography, Box, Button, ButtonGroup, Tooltip } from '@mui/material';
import { Add, Save, KeyboardCommandKey } from '@mui/icons-material';
import styled from '@emotion/styled';

const StyledAppBar = styled(AppBar)`
  background: #fff;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border-bottom: 1px solid #e2e8f0;
`;

const ToolbarActions = styled(Box)`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const KbdHint = styled.span`
  font-size: 10px;
  color: #64748b;
  font-weight: 500;
  margin-left: 4px;
`;

export function Toolbar({ productCode, productName, onAddModul, onAddSubModul, onAddPart, onSave, onCommand }) {
  const title = [productCode, productName].filter(Boolean).join(' | ') || 'BOM | eCount ERP';
  return (
    <StyledAppBar position="static">
      <MuiToolbar sx={{ fontFamily: 'var(--font-sans)', minHeight: 64, px: 2.5 }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, color: 'primary.main' }}>
          {title}
        </Typography>
        <KbdHint>Ctrl+K menu cepat</KbdHint>
        <ToolbarActions sx={{ ml: 1 }}>
          <ButtonGroup variant="outlined" size="small" sx={{ borderRadius: 2 }}>
            <Tooltip title="Produk jadi (Finished Good) — level paling atas BOM">
              <Button startIcon={<Add />} onClick={onAddModul}>Produk Jadi</Button>
            </Tooltip>
            <Tooltip title="Sub Assembly — komponen yang punya child">
              <Button startIcon={<Add />} onClick={onAddSubModul}>Sub Assembly</Button>
            </Tooltip>
            <Tooltip title="Bahan baku (Raw Material) — item leaf di BOM">
              <Button startIcon={<Add />} onClick={onAddPart}>Bahan Baku</Button>
            </Tooltip>
          </ButtonGroup>
          <Tooltip title="Simpan data ke browser (otomatis tersimpan lokal)">
            <Button variant="contained" startIcon={<Save />} onClick={onSave} sx={{ borderRadius: 2 }}>
              Simpan Draft
            </Button>
          </Tooltip>
          <Tooltip title="Buka menu aksi cepat (Ctrl+K)">
            <Button variant="outlined" startIcon={<KeyboardCommandKey />} onClick={onCommand} sx={{ borderRadius: 2 }}>
              Menu Cepat
            </Button>
          </Tooltip>
        </ToolbarActions>
      </MuiToolbar>
    </StyledAppBar>
  );
}
