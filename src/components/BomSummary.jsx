import React, { useMemo } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import styled from '@emotion/styled';

const Card = styled(Paper)`
  padding: 16px 20px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
`;

const SummaryTitle = styled(Typography)`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 4px;
  font-family: var(--font-sans), sans-serif;
`;

const SummaryValue = styled(Typography)`
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  font-family: var(--font-sans), sans-serif;
`;

function getRoutingTotals(routingSteps) {
  if (!Array.isArray(routingSteps) || !routingSteps.length) return { setupMin: 0, runMin: 0, costSetup: 0, costRun: 0 };
  let setupMin = 0;
  let runMin = 0;
  let costSetup = 0;
  let costRun = 0;
  routingSteps.forEach((s) => {
    setupMin += Number(s.setupTimeMin) || 0;
    runMin += Number(s.runTimeMin) || 0;
    costSetup += Number(s.costSetup) || 0;
    const perUnit = Number(s.costPerUnit) || 0;
    costRun += perUnit;
  });
  return { setupMin, runMin, costSetup, costRun };
}

function aggregateByModule(bomRows) {
  const parts = bomRows.filter((r) => r.levelNum === 2);
  const modules = bomRows.filter((r) => r.levelNum === 0);
  const byModule = new Map();

  parts.forEach((p) => {
    const modName = p.modul || 'Lainnya';
    if (!byModule.has(modName)) {
      byModule.set(modName, {
        moduleName: modName,
        partCount: 0,
        volCut: 0,
        volInv: 0,
        setupMin: 0,
        runMin: 0,
        costSetup: 0,
        costRun: 0,
      });
    }
    const agg = byModule.get(modName);
    agg.partCount += 1;
    agg.volCut += parseFloat(p.volCut) || 0;
    agg.volInv += parseFloat(p.volInv) || 0;
    const rt = getRoutingTotals(p.routingSteps);
    agg.setupMin += rt.setupMin;
    agg.runMin += rt.runMin;
    agg.costSetup += rt.costSetup;
    const qty = parseFloat(p.qty) || 1;
    agg.costRun += rt.costRun * qty;
  });

  return {
    byModule: Array.from(byModule.values()),
    totals: parts.reduce(
      (acc, p) => {
        acc.partCount += 1;
        acc.volCut += parseFloat(p.volCut) || 0;
        acc.volInv += parseFloat(p.volInv) || 0;
        const rt = getRoutingTotals(p.routingSteps);
        acc.setupMin += rt.setupMin;
        acc.runMin += rt.runMin;
        acc.costSetup += rt.costSetup;
        acc.costRun += (rt.costRun || 0) * (parseFloat(p.qty) || 1);
        return acc;
      },
      { partCount: 0, volCut: 0, volInv: 0, setupMin: 0, runMin: 0, costSetup: 0, costRun: 0 }
    ),
  };
}

function formatNum(n, decimals = 4) {
  if (n == null || Number.isNaN(n)) return '—';
  return Number(n).toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatCurrency(n) {
  if (n == null || Number.isNaN(n) || n === 0) return '—';
  return 'Rp ' + Number(n).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function BomSummary({ bomRows }) {
  const { byModule, totals } = useMemo(() => aggregateByModule(bomRows || []), [bomRows]);

  return (
    <Box sx={{ fontFamily: 'var(--font-sans)' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#0f172a' }}>
        Ringkasan BOM
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <SummaryTitle>Jumlah Part</SummaryTitle>
          <SummaryValue>{totals.partCount}</SummaryValue>
        </Card>
        <Card>
          <SummaryTitle>Total Vol. Cutting (M³)</SummaryTitle>
          <SummaryValue>{formatNum(totals.volCut)}</SummaryValue>
        </Card>
        <Card>
          <SummaryTitle>Total Vol. Invoice (M³)</SummaryTitle>
          <SummaryValue>{formatNum(totals.volInv)}</SummaryValue>
        </Card>
        <Card>
          <SummaryTitle>Total Setup (menit)</SummaryTitle>
          <SummaryValue>{totals.setupMin || '—'}</SummaryValue>
        </Card>
        <Card>
          <SummaryTitle>Total Run (menit)</SummaryTitle>
          <SummaryValue>{totals.runMin || '—'}</SummaryValue>
        </Card>
        <Card>
          <SummaryTitle>Total Biaya Setup</SummaryTitle>
          <SummaryValue sx={{ fontSize: 18 }}>{formatCurrency(totals.costSetup)}</SummaryValue>
        </Card>
        <Card>
          <SummaryTitle>Total Biaya Proses (run)</SummaryTitle>
          <SummaryValue sx={{ fontSize: 18 }}>{formatCurrency(totals.costRun)}</SummaryValue>
        </Card>
      </Box>

      <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b', fontWeight: 600 }}>
        Per modul
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 700, fontFamily: 'var(--font-sans)' }}>Produk / Assembly</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Part</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Vol. Cut (M³)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Vol. Inv (M³)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Setup (min)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Run (min)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Biaya Setup</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Biaya Run</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {byModule.map((row) => (
              <TableRow key={row.moduleName}>
                <TableCell sx={{ fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{row.moduleName}</TableCell>
                <TableCell align="right">{row.partCount}</TableCell>
                <TableCell align="right">{formatNum(row.volCut)}</TableCell>
                <TableCell align="right">{formatNum(row.volInv)}</TableCell>
                <TableCell align="right">{row.setupMin || '—'}</TableCell>
                <TableCell align="right">{row.runMin || '—'}</TableCell>
                <TableCell align="right">{formatCurrency(row.costSetup)}</TableCell>
                <TableCell align="right">{formatCurrency(row.costRun)}</TableCell>
              </TableRow>
            ))}
            {byModule.length > 0 && (
              <TableRow sx={{ bgcolor: '#f0fdfa', fontWeight: 700 }}>
                <TableCell sx={{ fontFamily: 'var(--font-sans)', fontWeight: 700 }}>Total</TableCell>
                <TableCell align="right">{totals.partCount}</TableCell>
                <TableCell align="right">{formatNum(totals.volCut)}</TableCell>
                <TableCell align="right">{formatNum(totals.volInv)}</TableCell>
                <TableCell align="right">{totals.setupMin || '—'}</TableCell>
                <TableCell align="right">{totals.runMin || '—'}</TableCell>
                <TableCell align="right">{formatCurrency(totals.costSetup)}</TableCell>
                <TableCell align="right">{formatCurrency(totals.costRun)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {byModule.length === 0 && (
        <Typography sx={{ color: '#64748b', py: 3, textAlign: 'center' }}>
          Belum ada data BOM. Tambah Produk Jadi & Bahan Baku di tab BOM (eCount).
        </Typography>
      )}
    </Box>
  );
}
