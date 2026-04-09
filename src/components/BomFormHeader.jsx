import React from 'react';
import { Box, TextField, Button, FormControlLabel, Checkbox, InputAdornment } from '@mui/material';
import { Search } from '@mui/icons-material';
import styled from '@emotion/styled';

const Card = styled(Box)`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  border: 1px solid #e2e8f0;
  padding: 20px 24px;
  margin-bottom: 0;
`;

const Grid = styled(Box)`
  display: grid;
  grid-template-columns: auto 1fr 1fr;
  gap: 16px 24px;
  align-items: start;
  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Label = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  display: block;
  margin-bottom: 6px;
`;

const FieldWrap = styled(Box)`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export function BomFormHeader({ metadata, onChange, onMasukkanBom }) {
  const handleChange = (key, value) => onChange({ [key]: value });

  return (
    <Card>
      <Grid>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Button
            variant="contained"
            size="medium"
            onClick={onMasukkanBom}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              bgcolor: '#2563eb',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              '&:hover': { bgcolor: '#1d4ed8' },
            }}
          >
            Masukkan BOM
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FieldWrap sx={{ flex: '1 1 200px' }}>
              <Label>Barang Produksi</Label>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Kode / Nama barang"
                  value={metadata?.barangProduksi ?? ([metadata?.productCode, metadata?.productName].filter(Boolean).join(' ') || '')}
                  onChange={(e) => handleChange('barangProduksi', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      fontSize: 13,
                      '&.Mui-focused': { bgcolor: '#fff' },
                    },
                  }}
                />
                <Button variant="outlined" size="small" sx={{ minWidth: 40, borderRadius: 2, borderColor: '#e2e8f0', color: '#64748b', fontWeight: 600 }}>Fn</Button>
              </Box>
            </FieldWrap>
            <FieldWrap sx={{ flex: '1 1 180px' }}>
              <Label>Proses</Label>
              <TextField
                size="small"
                fullWidth
                placeholder="Proses"
                value={metadata?.proses ?? ''}
                onChange={(e) => handleChange('proses', e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Search sx={{ fontSize: 18, color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    fontSize: 13,
                    '&.Mui-focused': { bgcolor: '#fff' },
                  },
                }}
              />
            </FieldWrap>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FieldWrap sx={{ width: 120 }}>
              <Label>Versi BOM</Label>
              <TextField
                size="small"
                type="number"
                value={metadata?.versiBom ?? '2'}
                onChange={(e) => handleChange('versiBom', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    fontSize: 13,
                    '&.Mui-focused': { bgcolor: '#fff' },
                  },
                }}
              />
            </FieldWrap>
            <Box sx={{ display: 'flex', alignItems: 'center', pt: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!metadata?.defaultVersi}
                    onChange={(e) => handleChange('defaultVersi', e.target.checked)}
                    size="small"
                    sx={{ color: '#64748b', '&.Mui-checked': { color: 'primary.main' } }}
                  />
                }
                label={<span style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>Default</span>}
              />
            </Box>
            <FieldWrap sx={{ width: 140 }}>
              <Label>Jumlah Manufaktur</Label>
              <TextField
                size="small"
                type="number"
                value={metadata?.bomQuantity ?? metadata?.jumlahManufaktur ?? '1'}
                onChange={(e) => {
                  handleChange('bomQuantity', e.target.value);
                  handleChange('jumlahManufaktur', e.target.value);
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    fontSize: 13,
                    '&.Mui-focused': { bgcolor: '#fff' },
                  },
                }}
              />
            </FieldWrap>
          </Box>
        </Box>
      </Grid>
    </Card>
  );
}
