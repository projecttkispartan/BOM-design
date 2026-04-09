import React from 'react';
import { TextField, Box, Typography } from '@mui/material';
import styled from '@emotion/styled';

const Root = styled(Box)`
  display: flex;
  flex-direction: column;
  background: #fff;
`;

const SectionTitle = styled(Typography)`
  padding: 16px 24px 0;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  font-family: var(--font-sans), sans-serif;
`;

const Grid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 16px 24px;
  padding: 20px 24px 24px;
`;

const Field = styled(Box)`
  & .MuiInputBase-root { font-size: 13px; font-weight: 600; font-family: var(--font-sans), sans-serif; border-radius: 10px; }
  & .MuiInputLabel-root { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; }
`;

const metaKeys = [
  { key: 'productCode', label: 'Kode Produk (eCount)', placeholder: 'Contoh: MM-1800' },
  { key: 'productName', label: 'Nama Produk', placeholder: 'Contoh: MEJA MAKAN' },
  { key: 'bomQuantity', label: 'Qty BOM', placeholder: '1' },
  { key: 'bomUnit', label: 'Unit', placeholder: 'EA, SET, KG' },
  { key: 'customer', label: 'Customer', placeholder: 'Contoh: AMATA' },
  { key: 'itemType', label: 'Tipe Item', placeholder: 'Contoh: TABLE / MEJA MAKAN' },
  { key: 'wood', label: 'Wood', placeholder: 'Contoh: JATI' },
  { key: 'coatingColor', label: 'Coating Color', placeholder: 'Contoh: NATURAL JATI' },
  { key: 'itemDim', label: 'Dimensi (P x L x T)', placeholder: '1800 x 900 x 750' },
  { key: 'volM3', label: 'Vol M3', placeholder: '0.00' },
];

export function MetadataSection({ metadata, onChange }) {
  return (
    <Root>
      <SectionTitle>BOM Header (eCount ERP)</SectionTitle>
      <Grid>
        {metaKeys.map(({ key, label, placeholder }) => (
          <Field key={key}>
            <TextField
              fullWidth
              size="small"
              label={label}
              placeholder={placeholder}
              value={metadata[key] ?? ''}
              onChange={(e) => onChange({ [key]: e.target.value })}
              variant="outlined"
              sx={{
                fontFamily: 'var(--font-sans)',
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f8fafc',
                  '&:hover': { bgcolor: '#f1f5f9' },
                  '&.Mui-focused': { bgcolor: '#fff' },
                },
              }}
            />
          </Field>
        ))}
      </Grid>
    </Root>
  );
}
