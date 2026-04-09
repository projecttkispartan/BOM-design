import React from 'react';
import { Box, TextField, Radio, RadioGroup, FormControlLabel, Typography, Button } from '@mui/material';
import { HelpOutline, Calculate } from '@mui/icons-material';

const labelSx = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.7)',
  fontWeight: 500,
  mb: 0.5,
  display: 'block',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.08)',
    color: '#fff',
    borderRadius: 1,
    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
    '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
  },
  '& .MuiInputBase-input': { fontSize: 13 },
};

export function BomConfigHeader({ metadata, onChange, onSave, onHitungBom }) {
  const productDisplay = metadata?.productDisplay ?? (`[${metadata?.productCode || ''}] ${metadata?.productName || ''}`.trim() || '');
  const handleChange = (key, value) => onChange({ [key]: value });
  const handleProductBlur = (e) => {
    const v = e.target.value?.trim() || '';
    const match = v.match(/^\[([^\]]*)\]\s*(.*)$/);
    const updates = { productDisplay: v };
    if (match) {
      updates.productCode = match[1].trim();
      updates.productName = match[2].trim();
    }
    onChange({ ...metadata, ...updates });
  };

  return (
    <Box
      sx={{
        bgcolor: '#1e293b',
        color: '#fff',
        p: 2.5,
        borderRadius: 0,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 3, maxWidth: 1100, alignItems: 'start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography component="label" sx={labelSx}>Product</Typography>
            <TextField
              fullWidth
              size="small"
              value={productDisplay}
              onBlur={handleProductBlur}
              onChange={(e) => handleChange('productDisplay', e.target.value)}
              placeholder="[KODE] Nama Produk (contoh: [MM-1800] MEJA MAKAN)"
              sx={fieldSx}
            />
          </Box>
          <Box>
            <Typography component="label" sx={labelSx}>
              Product Variant <HelpOutline sx={{ fontSize: 14, verticalAlign: 'middle', opacity: 0.7 }} />
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={metadata?.productVariant ?? ''}
              onChange={(e) => handleChange('productVariant', e.target.value)}
              placeholder="Cari atau pilih varian produk (opsional)"
              sx={fieldSx}
            />
          </Box>
          <Box>
            <Typography component="label" sx={labelSx}>
              Quantity <HelpOutline sx={{ fontSize: 14, verticalAlign: 'middle', opacity: 0.7 }} />
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                size="small"
                type="number"
                value={metadata?.bomQuantity ?? '1'}
                onChange={(e) => handleChange('bomQuantity', e.target.value)}
                inputProps={{ step: 0.01, min: 0 }}
                placeholder="1"
                sx={{ width: 100, ...fieldSx }}
              />
              <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Units</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography component="label" sx={labelSx}>
              Reference <Typography component="span" sx={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>(Opsional)</Typography>
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={metadata?.reference ?? ''}
              onChange={(e) => handleChange('reference', e.target.value)}
              placeholder="Masukkan referensi dokumen atau nomor order…"
              sx={fieldSx}
            />
          </Box>
          <Box>
            <Typography component="label" sx={labelSx}>BoM Type</Typography>
            <RadioGroup
              row
              value={metadata?.bomType ?? 'manufacture'}
              onChange={(e) => handleChange('bomType', e.target.value)}
              sx={{ gap: 1 }}
            >
              <FormControlLabel
                value="manufacture"
                control={<Radio size="small" sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: '#22c55e' } }} />}
                label={<Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>Manufacture this product</Typography>}
              />
              <FormControlLabel
                value="kit"
                control={<Radio size="small" sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: '#22c55e' } }} />}
                label={<Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>Kit</Typography>}
              />
            </RadioGroup>
          </Box>
          <Box>
            <Typography component="label" sx={labelSx}>Company</Typography>
            <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
              {metadata?.company ?? 'Demo Company'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 0.5 }}>
          {onHitungBom && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Calculate />}
              onClick={onHitungBom}
              sx={{ textTransform: 'none', fontWeight: 600, borderColor: 'rgba(255,255,255,0.35)', color: '#e2e8f0', '&:hover': { borderColor: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.06)' } }}
            >
              Hitung BOM
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
