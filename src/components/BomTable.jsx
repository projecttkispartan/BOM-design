import React, { useMemo, useState } from 'react';
import { Table } from 'antd';
import { Box, Button, IconButton, TextField } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import styled from '@emotion/styled';
import { RoutingStepsEditor } from './RoutingStepsEditor';
import { ECOUNT_ITEM_TYPES } from '../utils/initialState';

const cellHover = { '&:hover': { bgcolor: '#f0f9ff' } };

/** Sel teks Excel-like: klik untuk edit, Enter selesai */
function EditableTextCell({ value, field, rowId, onUpdate, align = 'left', placeholder = '— Klik untuk isi', width }) {
  const [focus, setFocus] = useState(false);
  const [inputVal, setInputVal] = useState(value ?? '');

  const handleFocus = () => {
    setInputVal(value ?? '');
    setFocus(true);
  };
  const handleBlur = () => {
    setFocus(false);
    const v = String(inputVal ?? '').trim();
    if (v !== (value ?? '')) onUpdate?.(rowId, { [field]: v || '' });
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
  };

  if (focus) {
    return (
      <TextField
        size="small"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        fullWidth
        placeholder={placeholder}
        inputProps={{ style: { textAlign: align, fontSize: 13 } }}
        sx={{ width: width || '100%', '& .MuiInputBase-root': { bgcolor: '#fff', borderRadius: 1 } }}
      />
    );
  }
  return (
    <Box
      onClick={handleFocus}
      sx={{
        cursor: 'pointer',
        py: 0.5,
        px: 1,
        borderRadius: 1,
        textAlign: align,
        fontSize: 13,
        minHeight: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        ...cellHover,
      }}
    >
      {value || placeholder}
    </Box>
  );
}

/** Sel dimensi: tampil P x L x T, edit parse ke dimAP, dimAL, dimAT */
function EditableDimensiCell({ row, rowId, onUpdate }) {
  const p = row.dimAP || row.dimDP || '';
  const l = row.dimAL || row.dimDL || '';
  const t = row.dimAT || row.dimDT || '';
  const display = [p, l, t].filter(Boolean).join(' × ') || '';

  const [focus, setFocus] = useState(false);
  const [inputVal, setInputVal] = useState(display);

  const handleFocus = () => {
    setInputVal(display || '');
    setFocus(true);
  };
  const handleBlur = () => {
    setFocus(false);
    const parts = String(inputVal).split(/[\sx×X,]+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const [dimAP, dimAL, dimAT] = parts;
      if (dimAP !== p || dimAL !== l || dimAT !== t) onUpdate?.(rowId, { dimAP, dimAL, dimAT });
    } else if (inputVal.trim() && !display) {
      onUpdate?.(rowId, { dimAP: parts[0] || '', dimAL: parts[1] || '', dimAT: parts[2] || '' });
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
  };

  if (focus) {
    return (
      <TextField
        size="small"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        placeholder="P × L × T"
        sx={{ width: '100%', '& .MuiInputBase-root': { bgcolor: '#fff', borderRadius: 1 } }}
        inputProps={{ style: { fontSize: 13 } }}
      />
    );
  }
  return (
    <Box onClick={handleFocus} sx={{ cursor: 'pointer', py: 0.5, px: 1, borderRadius: 1, fontSize: 13, minHeight: 32, display: 'flex', alignItems: 'center', ...cellHover }}>
      {display || '— Klik untuk isi'}
    </Box>
  );
}

/** Sel quantity: qty + unit (Excel-like) */
function EditableQuantityCell({ row, rowId, onUpdate }) {
  const qty = row.qty ?? '';
  const unit = row.unit ?? 'EA';
  const display = qty ? `${qty} ${unit}` : '';

  const [focus, setFocus] = useState(false);
  const [qtyVal, setQtyVal] = useState(qty);
  const [unitVal, setUnitVal] = useState(unit);

  const handleFocus = () => {
    setQtyVal(qty);
    setUnitVal(unit);
    setFocus(true);
  };
  const handleBlur = () => {
    setFocus(false);
    if (String(qtyVal).trim() !== String(qty) || String(unitVal).trim() !== String(unit)) {
      onUpdate?.(rowId, { qty: String(qtyVal).trim() || '', unit: String(unitVal).trim() || 'EA' });
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
  };

  if (focus) {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        <TextField
          size="small"
          value={qtyVal}
          onChange={(e) => setQtyVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="Qty"
          inputProps={{ style: { textAlign: 'right', fontSize: 13 } }}
          sx={{ width: 70, '& .MuiInputBase-root': { bgcolor: '#fff', borderRadius: 1 } }}
        />
        <TextField
          size="small"
          value={unitVal}
          onChange={(e) => setUnitVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Unit"
          sx={{ width: 56, '& .MuiInputBase-root': { bgcolor: '#fff', borderRadius: 1 } }}
          inputProps={{ style: { fontSize: 13 } }}
        />
      </Box>
    );
  }
  return (
    <Box onClick={handleFocus} sx={{ cursor: 'pointer', py: 0.5, px: 1, borderRadius: 1, fontSize: 13, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', ...cellHover }}>
      {display || '— Klik untuk isi'}
    </Box>
  );
}

/** Sel biaya: klik edit, total otomatis dari Satuan + Mesin + Tenaga Kerja */
function EditableBiayaCell({ value, field, rowId, onUpdate }) {
  const [focus, setFocus] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const num = Number(value) || 0;

  const handleFocus = () => {
    setInputVal(num ? String(num) : '');
    setFocus(true);
  };
  const handleBlur = () => {
    setFocus(false);
    const parsed = parseFloat(String(inputVal).replace(/\./g, '').replace(',', '.')) || 0;
    if (parsed !== num) onUpdate?.(rowId, { [field]: parsed ? String(parsed) : '' });
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
  };

  if (focus) {
    return (
      <TextField
        size="small"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        inputProps={{ style: { textAlign: 'right', fontSize: 13 } }}
        sx={{ width: '100%', maxWidth: 120, '& .MuiInputBase-root': { bgcolor: '#fff', borderRadius: 1 } }}
      />
    );
  }
  return (
    <Box
      onClick={handleFocus}
      sx={{
        cursor: 'pointer',
        py: 0.5,
        px: 1,
        borderRadius: 1,
        textAlign: 'right',
        fontSize: 13,
        minHeight: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        ...cellHover,
      }}
    >
      {num ? 'Rp ' + num.toLocaleString('id-ID') : '— Klik untuk isi'}
    </Box>
  );
}

const TableWrap = styled.div`
  --bom-radius: 12px;
  --bom-section-bg: #e0f2fe;
  --bom-header-bg: #f0f9ff;
  border-radius: var(--bom-radius);
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  background: #fff;
  .ant-table-wrapper { border-radius: var(--bom-radius); }
  .ant-table { background: transparent !important; }
  .ant-table-thead > tr > th {
    background: var(--bom-header-bg) !important;
    font-weight: 700 !important;
    font-size: 11px !important;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #0c4a6e;
    border-bottom: 1px solid #bae6fd !important;
    padding: 10px 12px !important;
  }
  .ant-table-thead > tr:first-child > th {
    background: var(--bom-section-bg) !important;
    font-size: 12px !important;
    color: #0369a1;
  }
  .ant-table-tbody > tr > td {
    padding: 10px 12px !important;
    font-size: 13px;
    color: #334155;
    border-bottom: 1px solid #e2e8f0 !important;
  }
  .bom-cell-item { display: flex; align-items: center; gap: 12px; }
  .bom-thumb { width: 36px; height: 36px; min-width: 36px; background: #e2e8f0; border-radius: 6px; }
  .bom-item-info { display: flex; flex-direction: column; gap: 2px; }
  .bom-item-name { font-weight: 600; color: #0f172a; }
  .bom-item-code { font-size: 12px; color: #64748b; }
`;

const LevelBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 8px;
  font-family: var(--font-sans), sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const ModuleTag = styled(LevelBadge)`
  background: #2563eb;
  color: #fff;
`;
const SubModuleTag = styled(LevelBadge)`
  background: #059669;
  color: #fff;
`;
const BomTag = styled(LevelBadge)`
  background: #d97706;
  color: #fff;
`;

function getLevelTag(levelNum) {
  if (levelNum === 0) return <ModuleTag>MODULE</ModuleTag>;
  if (levelNum === 1) return <SubModuleTag>SUB MODULE</SubModuleTag>;
  return <BomTag>BOM</BomTag>;
}

function formatDimensi(row) {
  const p = row.dimAP || row.dimDP;
  const l = row.dimAL || row.dimDL;
  const t = row.dimAT || row.dimDT;
  if (p && l && t) return `${p} X ${l} X ${t}`;
  return '—';
}

function formatRupiah(val) {
  if (val == null || val === '' || Number.isNaN(Number(val))) return '—';
  return 'Rp ' + Number(val).toLocaleString('id-ID');
}

function getTotalBiaya(row) {
  const a = Number(row.biayaSatuan) || 0;
  const b = Number(row.biayaMesin) || 0;
  const c = Number(row.biayaTenagaKerja) || 0;
  if (a + b + c === 0) return '—';
  return 'Rp ' + (a + b + c).toLocaleString('id-ID');
}

function buildTree(rows, parentId = null) {
  return rows
    .filter((r) => r.parentId === parentId)
    .map((row) => {
      const children = buildTree(rows, row.id);
      return {
        ...row,
        key: row.id,
        children: children.length ? children : undefined,
      };
    });
}

function getVisibleRows(rows, expandedKeys) {
  const byId = new Map(rows.map((r) => [r.id, r]));
  function visible(row) {
    let pid = row.parentId;
    while (pid) {
      const p = byId.get(pid);
      if (!p || !expandedKeys.includes(pid)) return false;
      pid = p.parentId;
    }
    return true;
  }
  return rows.filter(visible);
}

function getRowClassName(record) {
  const level = record.levelNum ?? 2;
  if (level === 0) return 'bom-row-modul';
  if (level === 1) return 'bom-row-submodul';
  return 'bom-row-part';
}

const emptyLocale = {
  emptyText: (
    <span style={{ color: '#64748b', fontFamily: 'var(--font-sans)', padding: 24, lineHeight: 1.6 }}>
      Belum ada data BOM (eCount). Tambah <strong>Produk Jadi</strong>, lalu <strong>Sub Assembly</strong> dan <strong>Bahan Baku</strong>. Atau tekan <strong>Ctrl+K</strong> untuk menu cepat.
    </span>
  ),
};

export function BomTable({ bomRows, density, updateBomRow }) {
  const defaultExpandAll = useMemo(
    () => bomRows.filter((r) => r.levelNum === 0 || r.levelNum === 1).map((r) => r.id),
    [bomRows]
  );
  const [expandedRowKeys, setExpandedRowKeys] = React.useState(defaultExpandAll);

  React.useEffect(() => {
    setExpandedRowKeys((prev) => {
      const next = new Set(prev);
      defaultExpandAll.forEach((k) => next.add(k));
      return Array.from(next);
    });
  }, [bomRows.length]);

  const visibleRows = useMemo(() => getVisibleRows(bomRows, expandedRowKeys), [bomRows, expandedRowKeys]);
  const treeData = useMemo(() => buildTree(visibleRows), [visibleRows]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tableMode, setTableMode] = useState('find'); // find | sort

  const size = density === 'compact' ? 'small' : density === 'comfortable' ? 'middle' : 'small';

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys) => setSelectedRowKeys(keys),
      getCheckboxProps: (record) => ({ disabled: false }),
    }),
    [selectedRowKeys]
  );

  const columns = [
    {
      title: 'IDENTITAS KOMPONEN',
      children: [
        {
          title: 'ITEM',
          key: 'item',
          width: 280,
          fixed: 'left',
          render: (_, record) => (
            <div className="bom-cell-item">
              <div className="bom-thumb" />
              <div className="bom-item-info">
                <span className="bom-item-name">{record.description || record.modul || '—'}</span>
                <span className="bom-item-code">{record.partCode || '—'}</span>
                <span style={{ marginTop: 4 }}>{getLevelTag(record.levelNum ?? 2)}</span>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: 'TECHNICAL SPEC',
      children: [
        {
          title: 'DIMENSI (MM)',
          key: 'dimensi',
          width: 130,
          align: 'center',
          render: (_, record) => <EditableDimensiCell row={record} rowId={record.id} onUpdate={updateBomRow} />,
        },
        {
          title: 'VOLUME (M3)',
          key: 'volCut',
          width: 100,
          align: 'right',
          render: (_, r) => (
            <EditableTextCell
              value={r.volCut}
              field="volCut"
              rowId={r.id}
              onUpdate={updateBomRow}
              align="right"
              placeholder="0"
            />
          ),
        },
        {
          title: 'QUANTITY',
          key: 'quantity',
          width: 110,
          align: 'center',
          render: (_, r) => <EditableQuantityCell row={r} rowId={r.id} onUpdate={updateBomRow} />,
        },
      ],
    },
    {
      title: 'MANUFACTURE',
      children: [
        {
          title: 'MANUFACTURE',
          key: 'manufacture',
          width: 120,
          ellipsis: true,
          render: (_, r) => (
            <EditableTextCell
              value={r.manufacture ?? r.procCode}
              field="manufacture"
              rowId={r.id}
              onUpdate={updateBomRow}
              placeholder="Kode proses"
            />
          ),
        },
      ],
    },
    {
      title: 'WORK CENTER & ROUTING',
      children: [
        {
          title: 'WORK CENTER',
          key: 'workCenter',
          width: 140,
          ellipsis: true,
          render: (_, r) => (
            <EditableTextCell
              value={r.pusatBiaya || r.workCenterOrRouting}
              field="pusatBiaya"
              rowId={r.id}
              onUpdate={updateBomRow}
              placeholder="Pusat biaya"
            />
          ),
        },
        {
          title: 'ROUTING',
          key: 'routing',
          width: 160,
          ellipsis: true,
          render: (_, r) => (
            <EditableTextCell
              value={r.workCenterOrRouting || r.ketProses}
              field="workCenterOrRouting"
              rowId={r.id}
              onUpdate={updateBomRow}
              placeholder="Routing"
            />
          ),
        },
      ],
    },
    {
      title: 'TREATMENT',
      children: [
        {
          title: 'TREATMENT',
          key: 'perawatan',
          width: 100,
          render: (_, r) => (
            <EditableTextCell
              value={r.perawatan}
              field="perawatan"
              rowId={r.id}
              onUpdate={updateBomRow}
              placeholder="Perawatan"
            />
          ),
        },
      ],
    },
    {
      title: 'FINANCIAL',
      children: [
        {
          title: 'UNIT COST',
          key: 'biayaSatuan',
          width: 110,
          align: 'right',
          render: (_, r) => <EditableBiayaCell value={r.biayaSatuan} field="biayaSatuan" rowId={r.id} onUpdate={updateBomRow} />,
        },
        {
          title: 'MACHINE COST',
          key: 'biayaMesin',
          width: 120,
          align: 'right',
          render: (_, r) => <EditableBiayaCell value={r.biayaMesin} field="biayaMesin" rowId={r.id} onUpdate={updateBomRow} />,
        },
        {
          title: 'LABOR COST',
          key: 'biayaTenagaKerja',
          width: 120,
          align: 'right',
          render: (_, r) => <EditableBiayaCell value={r.biayaTenagaKerja} field="biayaTenagaKerja" rowId={r.id} onUpdate={updateBomRow} />,
        },
        {
          title: 'TOTAL COST',
          key: 'totalBiaya',
          width: 120,
          align: 'right',
          render: (_, r) => (
            <Box sx={{ py: 0.5, px: 1, fontSize: 13, fontWeight: 600, color: '#0c4a6e', textAlign: 'right' }}>
              {getTotalBiaya(r)}
            </Box>
          ),
        },
      ],
    },
    {
      title: 'NOTE & RELASI',
      children: [
        {
          title: 'NOTE',
          key: 'keterangan',
          width: 120,
          ellipsis: true,
          render: (_, r) => (
            <EditableTextCell
              value={r.keterangan}
              field="keterangan"
              rowId={r.id}
              onUpdate={updateBomRow}
              placeholder="Catatan"
            />
          ),
        },
        {
          title: 'RELASI BOM',
          key: 'infoBom',
          width: 140,
          render: (_, r) => (
            <EditableTextCell
              value={r.infoBom}
              field="infoBom"
              rowId={r.id}
              onUpdate={updateBomRow}
              placeholder="Link / ref BOM"
            />
          ),
        },
        {
          title: 'AKSI',
          key: 'aksi',
          width: 90,
          align: 'center',
          render: (_, record) => (
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
              <IconButton size="small" sx={{ color: '#059669', '&:hover': { bgcolor: '#d1fae5' } }}><EditIcon fontSize="small" /></IconButton>
              <IconButton size="small" sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          ),
        },
      ],
    },
  ];

  const expandable = useMemo(
    () => ({
      expandedRowKeys,
      onExpandedRowsChange: setExpandedRowKeys,
      defaultExpandAllRows: false,
      expandedRowRender: (record) => {
        const isPart = record.levelNum === 2;
        if (!isPart) return <span style={{ padding: 8, color: '#64748b', fontSize: 13 }}>Detail routing & proses hanya untuk level Bahan Baku (Raw Material).</span>;
        return (
          <RoutingStepsEditor
            rowId={record.id}
            routingSteps={record.routingSteps}
            onChange={(nextSteps) => updateBomRow?.(record.id, { routingSteps: nextSteps })}
            readOnly={!updateBomRow}
          />
        );
      },
    }),
    [expandedRowKeys, updateBomRow]
  );

  return (
    <TableWrap>
      <Box sx={{ display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0', mb: 0 }}>
        <Button
          variant="text"
          size="small"
          onClick={() => setTableMode('find')}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 13,
            px: 2,
            py: 1.25,
            borderRadius: 0,
            borderBottom: tableMode === 'find' ? 2 : 0,
            borderColor: 'primary.main',
            color: tableMode === 'find' ? 'primary.main' : '#64748b',
          }}
        >
          Temukan (F3)
        </Button>
        <Button
          variant="text"
          size="small"
          onClick={() => setTableMode('sort')}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 13,
            px: 2,
            py: 1.25,
            borderRadius: 0,
            borderBottom: tableMode === 'sort' ? 2 : 0,
            borderColor: 'primary.main',
            color: tableMode === 'sort' ? 'primary.main' : '#64748b',
          }}
        >
          Sortir
        </Button>
      </Box>
      <Table
        size={size}
        rowSelection={rowSelection}
        columns={columns}
        dataSource={treeData}
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowClassName={getRowClassName}
        locale={emptyLocale}
        expandable={expandable}
        style={{ fontFamily: 'var(--font-sans)' }}
        className="bom-hierarchy-table bom-table-modern"
      />
    </TableWrap>
  );
}

