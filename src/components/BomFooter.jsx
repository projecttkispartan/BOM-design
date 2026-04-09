import React from 'react';
import { Box, Button } from '@mui/material';
import { Save } from '@mui/icons-material';
import styled from '@emotion/styled';

const Root = styled(Box)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  border-radius: 0 0 12px 12px;
`;

export function BomFooter({ onSave, onViewStages, onClose }) {
  return (
    <Root sx={{ justifyContent: 'flex-end' }}>
      <Button
        variant="outlined"
        onClick={onClose}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 2,
          borderColor: '#e2e8f0',
          color: '#475569',
          '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
        }}
      >
        Batalkan
      </Button>
      <Button
        variant="contained"
        startIcon={<Save />}
        onClick={onSave}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 2,
          bgcolor: '#2563eb',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          '&:hover': { bgcolor: '#1d4ed8' },
        }}
      >
        Simpan
      </Button>
    </Root>
  );
}
