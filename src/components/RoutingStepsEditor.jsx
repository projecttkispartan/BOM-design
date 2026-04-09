import React from 'react';
import { Box, Button, TextField, IconButton, Select, MenuItem, FormControl, InputLabel, InputAdornment } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { ROUTING_PROCESS_TYPES, generateRoutingStepId } from '../utils/initialState';
import styled from '@emotion/styled';

const Root = styled(Box)`
  padding: 12px 16px 16px 48px;
  background: #f8fafc;
  border-radius: 8px;
  margin: 4px 0;
`;

const StepRow = styled(Box)`
  display: grid;
  grid-template-columns: 140px 90px 90px 100px 120px 120px 1fr 40px;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  font-family: var(--font-sans), sans-serif;
`;

const Label = styled(InputLabel)`
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 4px;
`;

export function RoutingStepsEditor({ rowId, routingSteps = [], onChange, readOnly }) {
  const steps = Array.isArray(routingSteps) ? routingSteps : [];

  const handleChange = (stepId, field, value) => {
    const next = steps.map((s) =>
      s.id === stepId ? { ...s, [field]: value } : s
    );
    onChange(next);
  };

  const handleAdd = () => {
    onChange([
      ...steps,
      {
        id: generateRoutingStepId(),
        process: 'other',
        setupTimeMin: '',
        runTimeMin: '',
        costSetup: '',
        costPerUnit: '',
        notes: '',
      },
    ]);
  };

  const handleRemove = (stepId) => {
    onChange(steps.filter((s) => s.id !== stepId));
  };

  const formatCurrency = (v) => {
    if (v === '' || v == null) return '';
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return new Intl.NumberFormat('id-ID', { style: 'decimal', minimumFractionDigits: 0 }).format(n);
  };

  const parseNum = (s) => {
    if (s === '' || s == null) return '';
    const n = parseFloat(String(s).replace(/\s/g, ''));
    return Number.isNaN(n) ? s : n;
  };

  return (
    <Root>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Label>Detail Routing — Setup waktu & biaya</Label>
        {!readOnly && (
          <Button size="small" startIcon={<Add />} onClick={handleAdd} sx={{ fontFamily: 'var(--font-sans)' }}>
            Tambah proses
          </Button>
        )}
      </Box>
      {steps.length === 0 && (
        <Box sx={{ color: '#64748b', fontSize: 13, py: 1 }}>
          Belum ada langkah proses. Klik &quot;Tambah proses&quot; untuk menambah Finishing, Glue Area, atau Packing.
        </Box>
      )}
      {steps.map((step) => (
        <StepRow key={step.id}>
          <FormControl size="small" fullWidth>
            <InputLabel>Proses</InputLabel>
            <Select
              value={step.process || 'other'}
              label="Proses"
              onChange={(e) => handleChange(step.id, 'process', e.target.value)}
              disabled={readOnly}
              sx={{ fontFamily: 'var(--font-sans)', bgcolor: '#fff' }}
            >
              {ROUTING_PROCESS_TYPES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Setup (menit)"
            type="number"
            value={step.setupTimeMin ?? ''}
            onChange={(e) => handleChange(step.id, 'setupTimeMin', e.target.value === '' ? '' : parseNum(e.target.value))}
            disabled={readOnly}
            inputProps={{ min: 0, step: 1 }}
            sx={{ fontFamily: 'var(--font-sans)', '& .MuiInputBase-root': { bgcolor: '#fff' } }}
          />
          <TextField
            size="small"
            label="Run (menit)"
            type="number"
            value={step.runTimeMin ?? ''}
            onChange={(e) => handleChange(step.id, 'runTimeMin', e.target.value === '' ? '' : parseNum(e.target.value))}
            disabled={readOnly}
            inputProps={{ min: 0, step: 1 }}
            sx={{ fontFamily: 'var(--font-sans)', '& .MuiInputBase-root': { bgcolor: '#fff' } }}
          />
          <TextField
            size="small"
            label="Biaya setup"
            value={step.costSetup ?? ''}
            onChange={(e) => handleChange(step.id, 'costSetup', e.target.value === '' ? '' : parseNum(e.target.value))}
            disabled={readOnly}
            InputProps={{
              startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
            }}
            sx={{ fontFamily: 'var(--font-sans)', '& .MuiInputBase-root': { bgcolor: '#fff' } }}
          />
          <TextField
            size="small"
            label="Biaya/unit"
            value={step.costPerUnit ?? ''}
            onChange={(e) => handleChange(step.id, 'costPerUnit', e.target.value === '' ? '' : parseNum(e.target.value))}
            disabled={readOnly}
            InputProps={{
              startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
            }}
            sx={{ fontFamily: 'var(--font-sans)', '& .MuiInputBase-root': { bgcolor: '#fff' } }}
          />
          <TextField
            size="small"
            label="Catatan"
            value={step.notes ?? ''}
            onChange={(e) => handleChange(step.id, 'notes', e.target.value)}
            disabled={readOnly}
            placeholder="Opsional"
            sx={{ fontFamily: 'var(--font-sans)', '& .MuiInputBase-root': { bgcolor: '#fff' } }}
          />
          {!readOnly && (
            <IconButton size="small" onClick={() => handleRemove(step.id)} aria-label="Hapus langkah">
              <Delete fontSize="small" />
            </IconButton>
          )}
        </StepRow>
      ))}
    </Root>
  );
}
