import React, { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { BomSummary } from './BomSummary';

function formatCurrency(n) {
  if (n == null || Number.isNaN(n) || n === 0) return '—';
  return 'Rp ' + Number(n).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getTotalBiayaRows(bomRows) {
  let total = 0;
  (bomRows || []).forEach((r) => {
    const a = Number(r.biayaSatuan) || 0;
    const b = Number(r.biayaMesin) || 0;
    const c = Number(r.biayaTenagaKerja) || 0;
    total += a + b + c;
  });
  return total;
}

/** Urutkan baris BOM secara hierarki (pre-order) seperti Katana MRP */
function buildOrderedParts(rows) {
  const result = [];
  function walk(parentId) {
    rows
      .filter((r) => r.parentId === parentId)
      .sort((a, b) => String(a.mod || '').localeCompare(String(b.mod || ''), undefined, { numeric: true }))
      .forEach((row) => {
        result.push(row);
        walk(row.id);
      });
  }
  walk(null);
  return result;
}

export function KalkulasiDialog({ open, onClose, bomRows }) {
  const totalBiaya = useMemo(() => getTotalBiayaRows(bomRows), [bomRows]);
  const orderedParts = useMemo(() => buildOrderedParts(bomRows || []), [bomRows]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#1e293b',
          color: '#e2e8f0',
          fontFamily: 'var(--font-sans)',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.12)', pb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
          View Kalkulasi
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ bgcolor: '#0f172a', borderRadius: 2, p: 2, mb: 2 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.05, mb: 0.5 }}>
            Total Biaya (Unit + Mesin + Tenaga Kerja)
          </Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#38bdf8' }}>
            {formatCurrency(totalBiaya)}
          </Typography>
        </Box>

        {/* Data Part — daftar part/ingredients mirip Katana MRP BOM */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e2e8f0', mb: 1, fontFamily: 'var(--font-sans)' }}>
          Data Part
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', bgcolor: '#fff' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'var(--font-sans)' }}>No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Part Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nama / Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Modul</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Cost</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Machine</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Labor</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Total Cost</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lead Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orderedParts.map((row) => {
                const unitCost = Number(row.biayaSatuan) || 0;
                const machine = Number(row.biayaMesin) || 0;
                const labor = Number(row.biayaTenagaKerja) || 0;
                const totalCost = unitCost + machine + labor;
                return (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontFamily: 'var(--font-sans)' }}>{row.mod || row.no || '—'}</TableCell>
                    <TableCell>{row.partCode || '—'}</TableCell>
                    <TableCell>{row.description || row.modul || '—'}</TableCell>
                    <TableCell>{row.modul || '—'}</TableCell>
                    <TableCell align="right">{row.qty != null && row.qty !== '' ? row.qty : '—'}</TableCell>
                    <TableCell>{row.unit || 'EA'}</TableCell>
                    <TableCell align="right">{formatCurrency(unitCost)}</TableCell>
                    <TableCell align="right">{formatCurrency(machine)}</TableCell>
                    <TableCell align="right">{formatCurrency(labor)}</TableCell>
                    <TableCell align="right">{formatCurrency(totalCost)}</TableCell>
                    <TableCell>{row.leadTime != null && row.leadTime !== '' ? row.leadTime : '—'}</TableCell>
                    <TableCell>{row.supplier || '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {orderedParts.length === 0 && (
            <Box sx={{ py: 3, textAlign: 'center', color: '#64748b', fontFamily: 'var(--font-sans)' }}>
              Belum ada data part. Tambah komponen di tab Components.
            </Box>
          )}
        </TableContainer>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e2e8f0', mb: 1, fontFamily: 'var(--font-sans)' }}>
          Ringkasan per Modul
        </Typography>
        <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 2, color: '#0f172a' }}>
          <BomSummary bomRows={bomRows} />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
