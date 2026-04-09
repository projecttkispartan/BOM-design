import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Button,
  Drawer,
  Menu,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  DragIndicator,
  DeleteOutline,
  ExpandMore,
  ChevronRight,
  Add,
  ViewColumn,
  Close,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import styled from '@emotion/styled';
import { useTableKeyboardNav } from '../hooks/useTableKeyboardNav';
import { EditableCell } from './EditableCell';

const EMPTY_COLOR = '#4a5568';
const INDENT_PER_LEVEL = 24;

const COL = {
  icon: 36,
  no: 44,
  kode: 100,
  nama: 160,
  qty: 64,
  workCenter: 92,
  wcSetup: 52,
  wcRun: 52,
  routing: 92,
  rteSetup: 52,
  rteRun: 52,
  assembling: 72,
  asmTime: 52,
  glueArea: 72,
  glueTime: 52,
  panjang: 68,
  lebar: 68,
  tinggi: 68,
  volume: 80,
  biayaSatuan: 88,
  biayaMesin: 88,
  biayaTk: 88,
  additional: 100,
  action: 44,
};

const FROZEN_KEYS = ['icon', 'no', 'kode', 'nama'];
const FROZEN_LEFT = { icon: 0, no: COL.icon, kode: COL.icon + COL.no, nama: COL.icon + COL.no + COL.kode };
function getStickyStyle(colKey, background) {
  if (!FROZEN_KEYS.includes(colKey)) return {};
  return {
    position: 'sticky',
    left: FROZEN_LEFT[colKey],
    zIndex: 2,
    background: background ?? '#1e293b',
    boxShadow: colKey === 'nama' ? '2px 0 6px rgba(0,0,0,0.2)' : undefined,
  };
}

const TableWrap = styled(Box)`
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 0;
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const Th = styled.th`
  text-align: left;
  padding: 8px 10px;
  font-weight: 600;
  color: rgba(255,255,255,0.75);
  border-bottom: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.2);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
`;

/** Level 1 header: group label (Manufacture, Proses, dll.) */
const ThGroup = styled.th`
  text-align: left;
  padding: 10px 12px;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  background: rgba(0,0,0,0.35);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid rgba(255,255,255,0.15);
  border-right: 2px solid rgba(255,255,255,0.22);
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 6px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  vertical-align: middle;
`;

const TypePill = styled.span`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
`;
const ModulePill = styled(TypePill)` background: #2563eb; color: #fff; `;
const SubModulePill = styled(TypePill)` background: #059669; color: #fff; `;
const PartPill = styled(TypePill)` background: #d97706; color: #fff; `;

function getTypeLabel(levelNum) {
  if (levelNum === 0) return <ModulePill>Modul</ModulePill>;
  if (levelNum === 1) return <SubModulePill>Sub Modul</SubModulePill>;
  return <PartPill>Part</PartPill>;
}

/** Tooltip untuk header kolom (konteks) */
const COL_HEADER_TOOLTIPS = {
  workCenter: 'Work Center',
  wcSetup: 'Setup (Work Center)',
  wcRun: 'Run (Work Center)',
  routing: 'Routing',
  rteSetup: 'Setup (Routing)',
  rteRun: 'Run (Routing)',
  assembling: 'Assembling',
  asmTime: 'Waktu (Assembling)',
  glueArea: 'Glue Area',
  glueTime: 'Waktu (Glue Area)',
};

/** Map column key to row field for clear-cell (Delete key). */
const COLKEY_TO_FIELD = {
  kode: 'partCode',
  nama: 'description',
  qty: 'qty',
  workCenter: 'pusatBiaya',
  wcSetup: 'workCenterSetupMin',
  wcRun: 'workCenterRunMin',
  routing: 'workCenterOrRouting',
  rteSetup: 'routingSetupMin',
  rteRun: 'routingRunMin',
  assembling: 'assembling',
  asmTime: 'assemblingTimeMin',
  glueArea: 'glueArea',
  glueTime: 'glueAreaTimeMin',
  panjang: 'dimAP',
  lebar: 'dimAL',
  tinggi: 'dimAT',
  volume: 'volCut',
  biayaSatuan: 'biayaSatuan',
  biayaMesin: 'biayaMesin',
  biayaTk: 'biayaTenagaKerja',
  additional: 'keterangan',
};

function BiayaWithTimeCell({ value, timeMin, valueField, timeField, rowId, onUpdate, emptyColor, isFocused, isEditing, onStartEdit, onConfirmEdit, onCancelEdit }) {
  return (
    <Box sx={{ py: 0.5 }} data-editable-cell>
      <EditableCell
        value={value}
        field={valueField}
        rowId={rowId}
        onUpdate={onUpdate}
        type="number"
        align="right"
        emptyColor={emptyColor ?? EMPTY_COLOR}
        isFocused={isFocused}
        isEditing={isEditing}
        onStartEdit={onStartEdit}
        onConfirmEdit={onConfirmEdit}
        onCancelEdit={onCancelEdit}
        min={0}
      />
      <Box sx={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', mt: 0.25, textAlign: 'right' }}>
        {timeMin != null && timeMin !== '' ? (
          <>
            <EditableCell value={timeMin} field={timeField} rowId={rowId} onUpdate={onUpdate} type="number" align="right" emptyColor={EMPTY_COLOR} min={0} />
            <Typography component="span" sx={{ fontSize: 'inherit', ml: 0.25, color: EMPTY_COLOR }}>min</Typography>
          </>
        ) : (
          <EditableCell value={timeMin} field={timeField} rowId={rowId} onUpdate={onUpdate} type="number" align="right" emptyColor={EMPTY_COLOR} min={0} />
        )}
      </Box>
    </Box>
  );
}

function getSortValue(row, sortKey) {
  const field = COLKEY_TO_FIELD[sortKey];
  if (field) {
    const v = row[field];
    if (typeof v === 'number' || (typeof v === 'string' && /^-?\d*\.?\d+$/.test(String(v)))) return Number(v) ?? 0;
    return String(v ?? '').toLowerCase();
  }
  if (sortKey === 'no') return row.no ?? 0;
  if (sortKey === 'nama') return (row.description || row.modul || '').toLowerCase();
  return String(row[sortKey] ?? '').toLowerCase();
}

/** Build flat list preserving hierarchy: only sort siblings, child always follows parent. */
function buildOrderedRows(rows, expandedKeys, sortBy) {
  const result = [];
  function walk(parentId) {
    let children = rows.filter((r) => r.parentId === parentId);
    if (sortBy && children.length > 1) {
      const dir = sortBy.dir === 'asc' ? 1 : -1;
      children = [...children].sort((a, b) => {
        const va = getSortValue(a, sortBy.key);
        const vb = getSortValue(b, sortBy.key);
        if (typeof va === 'number' && typeof vb === 'number') return dir * (va - vb);
        return dir * String(va).localeCompare(String(vb), undefined, { numeric: true });
      });
    }
    children.forEach((row) => {
      const isExpanded = expandedKeys.has(row.id);
      const hasChildren = rows.some((r) => r.parentId === row.id);
      if (parentId !== null && !isExpanded) return;
      result.push(row);
      if (hasChildren && isExpanded) walk(row.id);
    });
  }
  walk(null);
  return result;
}

function getIndent(rows, row) {
  let level = 0;
  let pid = row.parentId;
  const byId = new Map(rows.map((r) => [r.id, r]));
  while (pid) {
    level++;
    pid = byId.get(pid)?.parentId;
  }
  return level * INDENT_PER_LEVEL;
}

/** Header config: groupId, label, columns[] dengan key & label */
const HEADER_GROUPS = [
  { id: 'core', label: 'Komponen', cols: [
    { key: 'icon', label: '', width: COL.icon },
    { key: 'no', label: 'No', width: COL.no },
    { key: 'kode', label: 'Kode', width: COL.kode },
    { key: 'nama', label: 'Nama', width: COL.nama },
    { key: 'qty', label: 'Qty', width: COL.qty },
  ], alwaysVisible: true },
  { id: 'manufacture', label: 'Manufacture', cols: [
    { key: 'workCenter', label: 'Work Center', width: COL.workCenter },
    { key: 'wcSetup', label: 'Setup', width: COL.wcSetup },
    { key: 'wcRun', label: 'Run', width: COL.wcRun },
    { key: 'routing', label: 'Routing', width: COL.routing },
    { key: 'rteSetup', label: 'Setup', width: COL.rteSetup },
    { key: 'rteRun', label: 'Run', width: COL.rteRun },
  ] },
  { id: 'proses', label: 'Proses', cols: [
    { key: 'assembling', label: 'Assembling', width: COL.assembling },
    { key: 'asmTime', label: 'Waktu', width: COL.asmTime },
    { key: 'glueArea', label: 'Glue Area', width: COL.glueArea },
    { key: 'glueTime', label: 'Waktu', width: COL.glueTime },
  ] },
  { id: 'dimensi', label: 'Dimensi', cols: [
    { key: 'panjang', label: 'P', width: COL.panjang },
    { key: 'lebar', label: 'L', width: COL.lebar },
    { key: 'tinggi', label: 'T', width: COL.tinggi },
    { key: 'volume', label: 'Vol', width: COL.volume },
  ] },
  { id: 'biaya', label: 'Detail Biaya', cols: [
    { key: 'biayaSatuan', label: 'Satuan', width: COL.biayaSatuan },
    { key: 'biayaMesin', label: 'Mesin', width: COL.biayaMesin },
    { key: 'biayaTk', label: 'TK', width: COL.biayaTk },
  ] },
  { id: 'note', label: 'Catatan', cols: [
    { key: 'additional', label: 'Note', width: COL.additional },
  ] },
  { id: 'action', label: '', cols: [
    { key: 'action', label: '', width: COL.action },
  ], alwaysVisible: true },
];

function ComponentRow({
  row,
  rowIndex,
  bomRows,
  indentPx,
  onUpdate,
  onDelete,
  hasChildren,
  isExpanded,
  onToggle,
  visibleGroups,
  onRowClick,
  isCellFocused,
  isCellEditing,
  startEdit,
  stopEdit,
  focusAdjacent,
  rowRef,
  isNewRow,
}) {
  const typeLabel = getTypeLabel(row.levelNum ?? 2);
  const namaDisplay = (row.description || row.modul || '').trim();
  const isParent = (row.levelNum ?? 2) <= 1;
  const rowBg = isParent ? 'rgba(255,255,255,0.03)' : 'transparent';
  const treeBorder = row.parentId ? '2px solid rgba(255,255,255,0.12)' : 'none';
  const highlightBg = isNewRow ? 'rgba(56, 189, 248, 0.15)' : undefined;

  const handleRowClick = (e) => {
    if (e.target.closest('button') || e.target.closest('[role="button"]')) return;
    if (e.target.closest('[data-editable-cell]')) return;
    onRowClick?.(row);
  };

  const makeConfirmEdit = (colKey) => (payload) => {
    stopEdit?.();
    if (payload?.key === 'Tab') focusAdjacent?.(rowIndex, colKey, 'right');
    else if (payload?.key === 'Enter') focusAdjacent?.(rowIndex, colKey, 'down');
  };

  const emptyColor = EMPTY_COLOR;
  const renderCell = (key) => {
    if (key === 'icon') {
      return (
        <Td style={{ width: COL.icon, paddingLeft: 8 + indentPx, borderLeft: treeBorder, background: rowBg, ...getStickyStyle('icon', rowBg) }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {hasChildren ? (
              <IconButton size="small" onClick={() => onToggle?.(row.id)} sx={{ p: 0, color: 'rgba(255,255,255,0.5)' }}>
                {isExpanded ? <ExpandMore sx={{ fontSize: 18 }} /> : <ChevronRight sx={{ fontSize: 18 }} />}
              </IconButton>
            ) : (
              <DragIndicator sx={{ fontSize: 16, cursor: 'grab', opacity: 0.5 }} />
            )}
          </Box>
        </Td>
      );
    }
    if (key === 'no') return <Td style={{ width: COL.no, textAlign: 'center', background: rowBg, ...getStickyStyle('no', rowBg) }}>{row.no ?? <span style={{ color: emptyColor }}>—</span>}</Td>;
    if (key === 'kode') return (
      <Td style={{ width: COL.kode, background: rowBg, ...getStickyStyle('kode', rowBg) }}>
        <EditableCell value={row.partCode} field="partCode" rowId={row.id} onUpdate={onUpdate} emptyColor={emptyColor} emptyDisplay="—" isFocused={isCellFocused?.(rowIndex, 'kode')} isEditing={isCellEditing?.(rowIndex, 'kode')} onStartEdit={() => startEdit?.(rowIndex, 'kode')} onConfirmEdit={makeConfirmEdit('kode')} onCancelEdit={stopEdit} />
      </Td>
    );
    if (key === 'nama') return (
      <Td style={{ width: COL.nama, background: rowBg, ...getStickyStyle('nama', rowBg) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <EditableCell value={row.description || row.modul} field="description" rowId={row.id} onUpdate={onUpdate} emptyColor={emptyColor} isFocused={isCellFocused?.(rowIndex, 'nama')} isEditing={isCellEditing?.(rowIndex, 'nama')} onStartEdit={() => startEdit?.(rowIndex, 'nama')} onConfirmEdit={makeConfirmEdit('nama')} onCancelEdit={stopEdit} />
          {typeLabel}
        </Box>
      </Td>
    );
    if (key === 'qty') return (
      <Td style={{ width: COL.qty, background: rowBg }}>
        <EditableCell value={row.qty} field="qty" rowId={row.id} onUpdate={onUpdate} type="number" align="right" emptyColor={emptyColor} min={0} isFocused={isCellFocused?.(rowIndex, 'qty')} isEditing={isCellEditing?.(rowIndex, 'qty')} onStartEdit={() => startEdit?.(rowIndex, 'qty')} onConfirmEdit={makeConfirmEdit('qty')} onCancelEdit={stopEdit} />
      </Td>
    );
    if (key === 'workCenter') return (
      <Td style={{ width: COL.workCenter, background: rowBg }}><EditableCell value={row.pusatBiaya || row.workCenterOrRouting} field="pusatBiaya" rowId={row.id} onUpdate={onUpdate} emptyColor={emptyColor} isFocused={isCellFocused?.(rowIndex, 'workCenter')} isEditing={isCellEditing?.(rowIndex, 'workCenter')} onStartEdit={() => startEdit?.(rowIndex, 'workCenter')} onConfirmEdit={makeConfirmEdit('workCenter')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'wcSetup') return (
      <Td style={{ width: COL.wcSetup, background: rowBg }}><EditableCell value={row.workCenterSetupMin} field="workCenterSetupMin" rowId={row.id} onUpdate={onUpdate} type="number" align="right" emptyColor={emptyColor} min={0} isFocused={isCellFocused?.(rowIndex, 'wcSetup')} isEditing={isCellEditing?.(rowIndex, 'wcSetup')} onStartEdit={() => startEdit?.(rowIndex, 'wcSetup')} onConfirmEdit={makeConfirmEdit('wcSetup')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'wcRun') return (
      <Td style={{ width: COL.wcRun, background: rowBg }}><EditableCell value={row.workCenterRunMin} field="workCenterRunMin" rowId={row.id} onUpdate={onUpdate} type="number" align="right" emptyColor={emptyColor} min={0} isFocused={isCellFocused?.(rowIndex, 'wcRun')} isEditing={isCellEditing?.(rowIndex, 'wcRun')} onStartEdit={() => startEdit?.(rowIndex, 'wcRun')} onConfirmEdit={makeConfirmEdit('wcRun')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'routing') return (
      <Td style={{ width: COL.routing, background: rowBg }}><EditableCell value={row.workCenterOrRouting} field="workCenterOrRouting" rowId={row.id} onUpdate={onUpdate} emptyColor={emptyColor} isFocused={isCellFocused?.(rowIndex, 'routing')} isEditing={isCellEditing?.(rowIndex, 'routing')} onStartEdit={() => startEdit?.(rowIndex, 'routing')} onConfirmEdit={makeConfirmEdit('routing')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'rteSetup') return (
      <Td style={{ width: COL.rteSetup, background: rowBg }}><EditableCell value={row.routingSetupMin} field="routingSetupMin" rowId={row.id} onUpdate={onUpdate} type="number" align="right" emptyColor={emptyColor} min={0} isFocused={isCellFocused?.(rowIndex, 'rteSetup')} isEditing={isCellEditing?.(rowIndex, 'rteSetup')} onStartEdit={() => startEdit?.(rowIndex, 'rteSetup')} onConfirmEdit={makeConfirmEdit('rteSetup')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'rteRun') return (
      <Td style={{ width: COL.rteRun, background: rowBg }}><EditableCell value={row.routingRunMin} field="routingRunMin" rowId={row.id} onUpdate={onUpdate} type="number" align="right" emptyColor={emptyColor} min={0} isFocused={isCellFocused?.(rowIndex, 'rteRun')} isEditing={isCellEditing?.(rowIndex, 'rteRun')} onStartEdit={() => startEdit?.(rowIndex, 'rteRun')} onConfirmEdit={makeConfirmEdit('rteRun')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'assembling') return (
      <Td style={{ width: COL.assembling, background: rowBg }}><EditableCell value={row.assembling} field="assembling" rowId={row.id} onUpdate={onUpdate} emptyColor={emptyColor} isFocused={isCellFocused?.(rowIndex, 'assembling')} isEditing={isCellEditing?.(rowIndex, 'assembling')} onStartEdit={() => startEdit?.(rowIndex, 'assembling')} onConfirmEdit={makeConfirmEdit('assembling')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'asmTime') return (
      <Td style={{ width: COL.asmTime, background: rowBg }}><EditableCell value={row.assemblingTimeMin} field="assemblingTimeMin" rowId={row.id} onUpdate={onUpdate} type="number" align="right" emptyColor={emptyColor} min={0} isFocused={isCellFocused?.(rowIndex, 'asmTime')} isEditing={isCellEditing?.(rowIndex, 'asmTime')} onStartEdit={() => startEdit?.(rowIndex, 'asmTime')} onConfirmEdit={makeConfirmEdit('asmTime')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'glueArea') return (
      <Td style={{ width: COL.glueArea, background: rowBg }}><EditableCell value={row.glueArea} field="glueArea" rowId={row.id} onUpdate={onUpdate} emptyColor={emptyColor} isFocused={isCellFocused?.(rowIndex, 'glueArea')} isEditing={isCellEditing?.(rowIndex, 'glueArea')} onStartEdit={() => startEdit?.(rowIndex, 'glueArea')} onConfirmEdit={makeConfirmEdit('glueArea')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'glueTime') return (
      <Td style={{ width: COL.glueTime, background: rowBg }}><EditableCell value={row.glueAreaTimeMin} field="glueAreaTimeMin" rowId={row.id} onUpdate={onUpdate} type="number" align="right" emptyColor={emptyColor} min={0} isFocused={isCellFocused?.(rowIndex, 'glueTime')} isEditing={isCellEditing?.(rowIndex, 'glueTime')} onStartEdit={() => startEdit?.(rowIndex, 'glueTime')} onConfirmEdit={makeConfirmEdit('glueTime')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'panjang') return (
      <Td style={{ width: COL.panjang, background: rowBg }}><EditableCell value={row.dimAP || row.dimDP} field="dimAP" rowId={row.id} onUpdate={onUpdate} type="number" align="right" emptyColor={emptyColor} min={0} isFocused={isCellFocused?.(rowIndex, 'panjang')} isEditing={isCellEditing?.(rowIndex, 'panjang')} onStartEdit={() => startEdit?.(rowIndex, 'panjang')} onConfirmEdit={makeConfirmEdit('panjang')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'lebar') return (
      <Td style={{ width: COL.lebar, background: rowBg }}><EditableCell value={row.dimAL || row.dimDL} field="dimAL" rowId={row.id} onUpdate={onUpdate} type="number" align="right" emptyColor={emptyColor} min={0} isFocused={isCellFocused?.(rowIndex, 'lebar')} isEditing={isCellEditing?.(rowIndex, 'lebar')} onStartEdit={() => startEdit?.(rowIndex, 'lebar')} onConfirmEdit={makeConfirmEdit('lebar')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'tinggi') return (
      <Td style={{ width: COL.tinggi, background: rowBg }}><EditableCell value={row.dimAT || row.dimDT} field="dimAT" rowId={row.id} onUpdate={onUpdate} type="number" align="right" emptyColor={emptyColor} min={0} isFocused={isCellFocused?.(rowIndex, 'tinggi')} isEditing={isCellEditing?.(rowIndex, 'tinggi')} onStartEdit={() => startEdit?.(rowIndex, 'tinggi')} onConfirmEdit={makeConfirmEdit('tinggi')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'volume') return (
      <Td style={{ width: COL.volume, background: rowBg }}><EditableCell value={row.volCut} field="volCut" rowId={row.id} onUpdate={onUpdate} type="number" align="right" emptyColor={emptyColor} min={0} isFocused={isCellFocused?.(rowIndex, 'volume')} isEditing={isCellEditing?.(rowIndex, 'volume')} onStartEdit={() => startEdit?.(rowIndex, 'volume')} onConfirmEdit={makeConfirmEdit('volume')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'biayaSatuan') return (
      <Td style={{ width: COL.biayaSatuan, background: rowBg }}><BiayaWithTimeCell value={row.biayaSatuan} timeMin={row.unitCostTimeMin} valueField="biayaSatuan" timeField="unitCostTimeMin" rowId={row.id} onUpdate={onUpdate} emptyColor={emptyColor} isFocused={isCellFocused?.(rowIndex, 'biayaSatuan')} isEditing={isCellEditing?.(rowIndex, 'biayaSatuan')} onStartEdit={() => startEdit?.(rowIndex, 'biayaSatuan')} onConfirmEdit={makeConfirmEdit('biayaSatuan')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'biayaMesin') return (
      <Td style={{ width: COL.biayaMesin, background: rowBg }}><BiayaWithTimeCell value={row.biayaMesin} timeMin={row.machineCostTimeMin} valueField="biayaMesin" timeField="machineCostTimeMin" rowId={row.id} onUpdate={onUpdate} emptyColor={emptyColor} isFocused={isCellFocused?.(rowIndex, 'biayaMesin')} isEditing={isCellEditing?.(rowIndex, 'biayaMesin')} onStartEdit={() => startEdit?.(rowIndex, 'biayaMesin')} onConfirmEdit={makeConfirmEdit('biayaMesin')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'biayaTk') return (
      <Td style={{ width: COL.biayaTk, background: rowBg }}><BiayaWithTimeCell value={row.biayaTenagaKerja} timeMin={row.laborCostTimeMin} valueField="biayaTenagaKerja" timeField="laborCostTimeMin" rowId={row.id} onUpdate={onUpdate} emptyColor={emptyColor} isFocused={isCellFocused?.(rowIndex, 'biayaTk')} isEditing={isCellEditing?.(rowIndex, 'biayaTk')} onStartEdit={() => startEdit?.(rowIndex, 'biayaTk')} onConfirmEdit={makeConfirmEdit('biayaTk')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'additional') return (
      <Td style={{ width: COL.additional, background: rowBg }}><EditableCell value={row.keterangan} field="keterangan" rowId={row.id} onUpdate={onUpdate} emptyColor={emptyColor} isFocused={isCellFocused?.(rowIndex, 'additional')} isEditing={isCellEditing?.(rowIndex, 'additional')} onStartEdit={() => startEdit?.(rowIndex, 'additional')} onConfirmEdit={makeConfirmEdit('additional')} onCancelEdit={stopEdit} /></Td>
    );
    if (key === 'action') return (
      <Td style={{ width: COL.action, textAlign: 'center', background: rowBg }}>
        <IconButton size="small" onClick={() => onDelete?.(row.id)} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#f87171', bgcolor: 'rgba(248,113,113,0.1)' } }}>
          <DeleteOutline sx={{ fontSize: 18 }} />
        </IconButton>
      </Td>
    );
    return null;
  };

  return (
    <tr
      ref={rowRef}
      onClick={handleRowClick}
      style={{
        cursor: onRowClick ? 'pointer' : undefined,
        backgroundColor: highlightBg,
        transition: 'background-color 0.3s ease',
      }}
    >
      {HEADER_GROUPS.filter((g) => g.alwaysVisible || visibleGroups[g.id]).flatMap((g) => g.cols.map((c) => renderCell(c.key)))}
    </tr>
  );
}

/** Warna untuk drawer (string agar tidak ada error parser di sx) */
const DRAWER_COLOR_SUBTLE = 'rgba(255,255,255,0.6)';
const DRAWER_COLOR_ICON = 'rgba(255,255,255,0.7)';
const DRAWER_COLOR_DIVIDER = 'rgba(255,255,255,0.12)';

const inputSxDrawer = { '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.06)', color: '#fff' } };

/** Drawer detail baris: identitas tetap di atas, section collapsible, layout 2 kolom */
function RowDetailDrawer({ open, row, onClose, onUpdate }) {
  const [openSections, setOpenSections] = useState({ manufaktur: true, proses: true, dimensi: true, biaya: true, catatan: true });
  const toggleSection = (key) => setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  if (!row) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, bgcolor: '#1e293b', color: '#e2e8f0' } } }>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Sticky: Identitas selalu visible */}
        <Box sx={{ p: 2, flexShrink: 0, borderBottom: `1px solid ${DRAWER_COLOR_DIVIDER}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>Detail Baris</Typography>
            <IconButton onClick={onClose} sx={{ color: DRAWER_COLOR_ICON }}><Close /></IconButton>
          </Box>
          <Typography sx={{ color: DRAWER_COLOR_SUBTLE, fontSize: 12, mb: 1.5 }}>{getTypeLabel(row.levelNum ?? 2)}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Kode</Typography><TextField fullWidth size="small" value={row.partCode ?? ''} onChange={(e) => onUpdate?.(row.id, { partCode: e.target.value })} sx={{ mt: 0.5, ...inputSxDrawer }} /></Box>
            <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Qty</Typography><TextField fullWidth size="small" type="number" value={row.qty ?? ''} onChange={(e) => onUpdate?.(row.id, { qty: e.target.value })} sx={{ mt: 0.5, ...inputSxDrawer }} /></Box>
            <Box sx={{ gridColumn: '1 / -1' }}><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Nama</Typography><TextField fullWidth size="small" value={row.description ?? row.modul ?? ''} onChange={(e) => onUpdate?.(row.id, { description: e.target.value })} sx={{ mt: 0.5, ...inputSxDrawer }} /></Box>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {/* Manufaktur */}
          <Box sx={{ mb: 1 }}>
            <Button fullWidth onClick={() => toggleSection('manufaktur')} startIcon={<ExpandMore sx={{ transform: openSections.manufaktur ? 'rotate(180deg)' : 'none' }} />} sx={{ justifyContent: 'flex-start', color: 'rgba(255,255,255,0.85)', textTransform: 'none', fontSize: 13 }}>
              Manufaktur
            </Button>
            <Collapse in={openSections.manufaktur}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, pl: 1, mt: 0.5 }}>
                <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Work Center</Typography><TextField size="small" fullWidth value={(row.pusatBiaya || row.workCenterOrRouting) ?? ''} onChange={(e) => onUpdate?.(row.id, { pusatBiaya: e.target.value })} sx={inputSxDrawer} /></Box>
                <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Setup / Run (WC)</Typography><Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}><TextField size="small" type="number" placeholder="Setup" value={row.workCenterSetupMin ?? ''} onChange={(e) => onUpdate?.(row.id, { workCenterSetupMin: e.target.value })} sx={inputSxDrawer} /><TextField size="small" type="number" placeholder="Run" value={row.workCenterRunMin ?? ''} onChange={(e) => onUpdate?.(row.id, { workCenterRunMin: e.target.value })} sx={inputSxDrawer} /></Box></Box>
                <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Routing</Typography><TextField size="small" fullWidth value={row.workCenterOrRouting ?? ''} onChange={(e) => onUpdate?.(row.id, { workCenterOrRouting: e.target.value })} sx={inputSxDrawer} /></Box>
                <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Setup / Run (Rte)</Typography><Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}><TextField size="small" type="number" placeholder="Setup" value={row.routingSetupMin ?? ''} onChange={(e) => onUpdate?.(row.id, { routingSetupMin: e.target.value })} sx={inputSxDrawer} /><TextField size="small" type="number" placeholder="Run" value={row.routingRunMin ?? ''} onChange={(e) => onUpdate?.(row.id, { routingRunMin: e.target.value })} sx={inputSxDrawer} /></Box></Box>
              </Box>
            </Collapse>
          </Box>
          <Divider sx={{ borderColor: DRAWER_COLOR_DIVIDER, my: 1 }} />

          {/* Proses */}
          <Box sx={{ mb: 1 }}>
            <Button fullWidth onClick={() => toggleSection('proses')} startIcon={<ExpandMore sx={{ transform: openSections.proses ? 'rotate(180deg)' : 'none' }} />} sx={{ justifyContent: 'flex-start', color: 'rgba(255,255,255,0.85)', textTransform: 'none', fontSize: 13 }}>
              Proses
            </Button>
            <Collapse in={openSections.proses}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, pl: 1, mt: 0.5 }}>
                <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Assembling</Typography><TextField size="small" fullWidth value={row.assembling ?? ''} onChange={(e) => onUpdate?.(row.id, { assembling: e.target.value })} sx={inputSxDrawer} /></Box>
                <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Waktu (min)</Typography><TextField size="small" type="number" fullWidth value={row.assemblingTimeMin ?? ''} onChange={(e) => onUpdate?.(row.id, { assemblingTimeMin: e.target.value })} sx={inputSxDrawer} /></Box>
                <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Glue Area</Typography><TextField size="small" fullWidth value={row.glueArea ?? ''} onChange={(e) => onUpdate?.(row.id, { glueArea: e.target.value })} sx={inputSxDrawer} /></Box>
                <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Waktu (min)</Typography><TextField size="small" type="number" fullWidth value={row.glueAreaTimeMin ?? ''} onChange={(e) => onUpdate?.(row.id, { glueAreaTimeMin: e.target.value })} sx={inputSxDrawer} /></Box>
              </Box>
            </Collapse>
          </Box>
          <Divider sx={{ borderColor: DRAWER_COLOR_DIVIDER, my: 1 }} />

          {/* Dimensi */}
          <Box sx={{ mb: 1 }}>
            <Button fullWidth onClick={() => toggleSection('dimensi')} startIcon={<ExpandMore sx={{ transform: openSections.dimensi ? 'rotate(180deg)' : 'none' }} />} sx={{ justifyContent: 'flex-start', color: 'rgba(255,255,255,0.85)', textTransform: 'none', fontSize: 13 }}>
              Dimensi
            </Button>
            <Collapse in={openSections.dimensi}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, pl: 1, mt: 0.5 }}>
                <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>P</Typography><TextField size="small" type="number" fullWidth value={(row.dimAP || row.dimDP) ?? ''} onChange={(e) => onUpdate?.(row.id, { dimAP: e.target.value })} sx={inputSxDrawer} /></Box>
                <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>L</Typography><TextField size="small" type="number" fullWidth value={(row.dimAL || row.dimDL) ?? ''} onChange={(e) => onUpdate?.(row.id, { dimAL: e.target.value })} sx={inputSxDrawer} /></Box>
                <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>T</Typography><TextField size="small" type="number" fullWidth value={(row.dimAT || row.dimDT) ?? ''} onChange={(e) => onUpdate?.(row.id, { dimAT: e.target.value })} sx={inputSxDrawer} /></Box>
                <Box sx={{ gridColumn: '1 / -1' }}><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Volume</Typography><TextField size="small" type="number" fullWidth value={row.volCut ?? ''} onChange={(e) => onUpdate?.(row.id, { volCut: e.target.value })} sx={inputSxDrawer} /></Box>
              </Box>
            </Collapse>
          </Box>
          <Divider sx={{ borderColor: DRAWER_COLOR_DIVIDER, my: 1 }} />

          {/* Biaya */}
          <Box sx={{ mb: 1 }}>
            <Button fullWidth onClick={() => toggleSection('biaya')} startIcon={<ExpandMore sx={{ transform: openSections.biaya ? 'rotate(180deg)' : 'none' }} />} sx={{ justifyContent: 'flex-start', color: 'rgba(255,255,255,0.85)', textTransform: 'none', fontSize: 13 }}>
              Detail Biaya
            </Button>
            <Collapse in={openSections.biaya}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, pl: 1, mt: 0.5 }}>
                <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Biaya Satuan / Waktu</Typography><Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}><TextField size="small" type="number" fullWidth value={row.biayaSatuan ?? ''} onChange={(e) => onUpdate?.(row.id, { biayaSatuan: e.target.value })} sx={inputSxDrawer} /><TextField size="small" type="number" placeholder="min" value={row.unitCostTimeMin ?? ''} onChange={(e) => onUpdate?.(row.id, { unitCostTimeMin: e.target.value })} sx={inputSxDrawer} /></Box></Box>
                <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Biaya Mesin / Waktu</Typography><Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}><TextField size="small" type="number" fullWidth value={row.biayaMesin ?? ''} onChange={(e) => onUpdate?.(row.id, { biayaMesin: e.target.value })} sx={inputSxDrawer} /><TextField size="small" type="number" placeholder="min" value={row.machineCostTimeMin ?? ''} onChange={(e) => onUpdate?.(row.id, { machineCostTimeMin: e.target.value })} sx={inputSxDrawer} /></Box></Box>
                <Box sx={{ gridColumn: '1 / -1' }}><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Biaya TK / Waktu</Typography><Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}><TextField size="small" type="number" fullWidth value={row.biayaTenagaKerja ?? ''} onChange={(e) => onUpdate?.(row.id, { biayaTenagaKerja: e.target.value })} sx={inputSxDrawer} /><TextField size="small" type="number" placeholder="min" value={row.laborCostTimeMin ?? ''} onChange={(e) => onUpdate?.(row.id, { laborCostTimeMin: e.target.value })} sx={inputSxDrawer} /></Box></Box>
              </Box>
            </Collapse>
          </Box>
          <Divider sx={{ borderColor: DRAWER_COLOR_DIVIDER, my: 1 }} />

          {/* Catatan */}
          <Box>
            <Button fullWidth onClick={() => toggleSection('catatan')} startIcon={<ExpandMore sx={{ transform: openSections.catatan ? 'rotate(180deg)' : 'none' }} />} sx={{ justifyContent: 'flex-start', color: 'rgba(255,255,255,0.85)', textTransform: 'none', fontSize: 13 }}>
              Catatan
            </Button>
            <Collapse in={openSections.catatan}>
              <Box sx={{ pl: 1, mt: 0.5 }}><TextField size="small" label="Keterangan" fullWidth multiline rows={2} value={row.keterangan ?? ''} onChange={(e) => onUpdate?.(row.id, { keterangan: e.target.value })} sx={inputSxDrawer} /></Box>
            </Collapse>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}

const DEFAULT_VISIBLE = {
  manufacture: true,
  proses: true,
  dimensi: true,
  biaya: true,
  note: true,
};

export function ComponentsTable({ bomRows, updateBomRow, removeBomRow, onAddLine, onAddMeja, onCatalog, newRowId }) {
  const defaultExpanded = useMemo(
    () => new Set(bomRows.filter((r) => r.levelNum === 0 || r.levelNum === 1).map((r) => r.id)),
    [bomRows.length]
  );
  const [expandedKeys, setExpandedKeys] = useState(() => defaultExpanded);
  const [visibleGroups, setVisibleGroups] = useState(DEFAULT_VISIBLE);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const newRowRef = useRef(null);

  React.useEffect(() => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      defaultExpanded.forEach((id) => next.add(id));
      return next;
    });
  }, [bomRows.length, defaultExpanded]);

  const orderedRows = useMemo(
    () => buildOrderedRows(bomRows, expandedKeys, sortBy),
    [bomRows, expandedKeys, sortBy]
  );

  const handleSortHeader = useCallback((colKey) => {
    if (colKey === 'icon' || colKey === 'action') return;
    setSortBy((prev) =>
      prev?.key === colKey ? { key: colKey, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key: colKey, dir: 'asc' }
    );
  }, []);

  const visibleGroupsList = useMemo(
    () => HEADER_GROUPS.filter((g) => g.alwaysVisible || visibleGroups[g.id]),
    [visibleGroups]
  );

  const columnKeys = useMemo(
    () => visibleGroupsList.flatMap((g) => g.cols.map((c) => c.key)).filter((k) => k !== 'icon' && k !== 'action'),
    [visibleGroupsList]
  );

  const onClearCell = useCallback(
    (rowIndex, colKey) => {
      const field = COLKEY_TO_FIELD[colKey];
      if (!field) return;
      const row = orderedRows[rowIndex];
      if (row) updateBomRow(row.id, { [field]: '' });
    },
    [orderedRows, updateBomRow]
  );

  const {
    handleKeyDown,
    isCellFocused,
    isCellEditing,
    startEdit,
    stopEdit,
    focusAdjacent,
    focusCell,
  } = useTableKeyboardNav({
    rowCount: orderedRows.length,
    columnKeys,
    isRowVisible: () => true,
    onClearCell,
  });

  useEffect(() => {
    if (!newRowId || !bomRows.length) return;
    const row = bomRows.find((r) => r.id === newRowId);
    if (!row) return;
    const byId = new Map(bomRows.map((r) => [r.id, r]));
    const ancestorIds = [];
    let pid = row.parentId;
    while (pid) {
      ancestorIds.push(pid);
      pid = byId.get(pid)?.parentId;
    }
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      ancestorIds.forEach((id) => next.add(id));
      return next;
    });
  }, [newRowId, bomRows]);

  useEffect(() => {
    if (!newRowId || !orderedRows.length) return;
    const idx = orderedRows.findIndex((r) => r.id === newRowId);
    if (idx < 0) return;
    requestAnimationFrame(() => {
      newRowRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
      focusCell(idx, 'kode');
      startEdit(idx, 'kode');
    });
  }, [newRowId, orderedRows, focusCell, startEdit]);

  const toggleExpand = useCallback((id) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const hasChildren = useMemo(() => {
    const set = new Set();
    bomRows.forEach((r) => { if (r.parentId) set.add(r.parentId); });
    return set;
  }, [bomRows]);

  const toggleGroup = useCallback((groupId) => {
    setVisibleGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  const minTableWidth = useMemo(() => {
    let w = 0;
    visibleGroupsList.forEach((g) => g.cols.forEach((c) => { w += c.width; }));
    return w;
  }, [visibleGroupsList]);

  return (
    <TableWrap>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={onAddMeja}
            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#0ea5e9', '&:hover': { bgcolor: '#0284c7' } }}
          >
            + Tambah template
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={onAddLine}
            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' } }}
          >
            Tambah baris
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={onCatalog}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: 'rgba(255,255,255,0.3)', color: '#e2e8f0', '&:hover': { borderColor: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.06)' } }}
          >
            Catalog
          </Button>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Button
            size="small"
            startIcon={<ViewColumn />}
            onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
            sx={{ textTransform: 'none', color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
          >
            Kolom
          </Button>
          <Menu anchorEl={columnMenuAnchor} open={Boolean(columnMenuAnchor)} onClose={() => setColumnMenuAnchor(null)} PaperProps={{ sx: { bgcolor: '#1e293b', color: '#e2e8f0', minWidth: 200 } }}>
            {HEADER_GROUPS.filter((g) => !g.alwaysVisible).map((g) => (
              <MenuItem key={g.id} dense disableRipple>
                <FormControlLabel control={<Checkbox size="small" checked={!!visibleGroups[g.id]} onChange={() => toggleGroup(g.id)} sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: '#38bdf8' } }} />} label={g.label} sx={{ color: '#e2e8f0' }} />
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      <Box component="div" tabIndex={0} onKeyDown={handleKeyDown} sx={{ outline: 'none' }}>
      <Table style={{ minWidth: minTableWidth }}>
        <thead>
          {/* Baris 1: grup (Manufacture, Proses, Dimensi, dll.) */}
          <tr>
            {HEADER_GROUPS.filter((g) => g.alwaysVisible || visibleGroups[g.id]).map((group) => (
              <ThGroup key={group.id} colSpan={group.cols.length}>
                {group.label || '\u00A0'}
              </ThGroup>
            ))}
          </tr>
          {/* Baris 2: label kolom per grup */}
          <tr>
            {HEADER_GROUPS.filter((g) => g.alwaysVisible || visibleGroups[g.id]).map((group) =>
              group.cols.map((c, ci) => {
                const isManufacture = group.id === 'manufacture';
                const isWorkCenterCol = isManufacture && ci < 3;
                const isLastWorkCenter = isManufacture && ci === 2;
                const bg = isManufacture ? (isWorkCenterCol ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.35)') : 'rgba(0,0,0,0.28)';
                const borderRight = isLastWorkCenter
                  ? '3px solid rgba(255,255,255,0.35)'
                  : ci === group.cols.length - 1
                    ? '2px solid rgba(255,255,255,0.22)'
                    : undefined;
                const tooltipTitle = COL_HEADER_TOOLTIPS[c.key] || c.label;
                const isSortable = c.key !== 'icon' && c.key !== 'action' && c.key !== 'no';
                const isSorted = sortBy?.key === c.key;
                return (
                  <Th
                    key={`${group.id}-${c.key}`}
                    onClick={isSortable ? () => handleSortHeader(c.key) : undefined}
                    style={{
                      width: c.width,
                      borderRight,
                      background: bg,
                      textAlign: ['wcSetup', 'wcRun', 'rteSetup', 'rteRun', 'asmTime', 'glueTime', 'panjang', 'lebar', 'tinggi', 'volume', 'qty'].includes(c.key) ? 'right' : 'left',
                      ...getStickyStyle(c.key, bg),
                      cursor: isSortable ? 'pointer' : 'default',
                    }}
                  >
                    <Tooltip title={tooltipTitle} placement="top" arrow>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        {c.label}
                        {isSortable && (
                          isSorted
                            ? (sortBy.dir === 'asc' ? <ArrowUpward sx={{ fontSize: 14, opacity: 0.9 }} /> : <ArrowDownward sx={{ fontSize: 14, opacity: 0.9 }} />)
                            : <ArrowUpward sx={{ fontSize: 14, opacity: 0.35 }} />
                        )}
                      </span>
                    </Tooltip>
                  </Th>
                );
              })
            )}
          </tr>
        </thead>
        <tbody>
          {orderedRows.map((row, rowIndex) => (
            <ComponentRow
              key={row.id}
              row={row}
              rowIndex={rowIndex}
              bomRows={bomRows}
              indentPx={getIndent(bomRows, row)}
              onUpdate={updateBomRow}
              onDelete={removeBomRow}
              hasChildren={hasChildren.has(row.id)}
              isExpanded={expandedKeys.has(row.id)}
              onToggle={toggleExpand}
              visibleGroups={visibleGroups}
              onRowClick={setDetailRow}
              isCellFocused={isCellFocused}
              isCellEditing={isCellEditing}
              startEdit={startEdit}
              stopEdit={stopEdit}
              focusAdjacent={focusAdjacent}
              rowRef={row.id === newRowId ? newRowRef : undefined}
              isNewRow={row.id === newRowId}
            />
          ))}
        </tbody>
      </Table>
      </Box>

      <RowDetailDrawer open={!!detailRow} row={detailRow} onClose={() => setDetailRow(null)} onUpdate={updateBomRow} />
    </TableWrap>
  );
}
