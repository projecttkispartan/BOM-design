import React, { useMemo, useState, useCallback } from 'react';
import { Box, Select, MenuItem, TextField } from '@mui/material';
import { ExpandMore, ChevronRight, NoPhotography } from '@mui/icons-material';
import styled from '@emotion/styled';

const ITEM_TYPES = [
  { value: 0, label: 'MODULE' },
  { value: 1, label: 'SUB MODULE' },
  { value: 2, label: 'PART' },
];

const TagPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  white-space: nowrap;
`;
const ModuleTag = styled(TagPill)` background: #2563eb; color: #fff; `;
const SubModuleTag = styled(TagPill)` background: #059669; color: #fff; `;
const PartTag = styled(TagPill)` background: #d97706; color: #fff; `;

function getTag(levelNum, mod) {
  const prefix = mod ? `${mod} ` : '';
  if (levelNum === 0) return <ModuleTag>{prefix}MODULE</ModuleTag>;
  if (levelNum === 1) return <SubModuleTag>{prefix}SUB MODULE</SubModuleTag>;
  return <PartTag>{prefix}PART</PartTag>;
}

function buildOrderedList(rows, expandedKeys, parentId = null, result = []) {
  rows
    .filter((r) => r.parentId === parentId)
    .forEach((row) => {
      result.push(row);
      if (row.levelNum !== 2 && expandedKeys.includes(row.id)) {
        buildOrderedList(rows, expandedKeys, row.id, result);
      }
    });
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
  return level * 20;
}

/** Inline editable title - Excel-like: click to edit, Enter to blur */
function EditableTitle({ value, rowId, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value || '');

  const handleStart = () => {
    setLocal(value || '');
    setEditing(true);
  };
  const handleBlur = () => {
    setEditing(false);
    const v = (local || '').trim();
    if (v !== (value || '')) onUpdate?.(rowId, { description: v || undefined, modul: v || undefined });
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
  };

  if (editing) {
    return (
      <TextField
        size="small"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        variant="standard"
        fullWidth
        InputProps={{ disableUnderline: true }}
        sx={{
          '& .MuiInput-input': { fontSize: 15, fontWeight: 600, color: '#0f172a', py: 0.25 },
        }}
      />
    );
  }
  return (
    <Box
      component="span"
      onClick={handleStart}
      sx={{
        cursor: 'text',
        fontSize: 15,
        fontWeight: 600,
        color: '#0f172a',
        display: 'block',
        minHeight: 24,
        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 1 },
      }}
    >
      {value || '— Klik untuk isi'}
    </Box>
  );
}

/** Inline editable code */
function EditableCode({ value, rowId, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value || '');

  const handleStart = () => {
    setLocal(value || '');
    setEditing(true);
  };
  const handleBlur = () => {
    setEditing(false);
    const v = (local || '').trim();
    if (v !== (value || '')) onUpdate?.(rowId, { partCode: v || undefined });
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
  };

  if (editing) {
    return (
      <TextField
        size="small"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        variant="standard"
        fullWidth
        InputProps={{ disableUnderline: true }}
        sx={{ '& .MuiInput-input': { fontSize: 12, color: '#64748b', py: 0.25 } }}
      />
    );
  }
  return (
    <Box
      component="span"
      onClick={handleStart}
      sx={{
        cursor: 'text',
        fontSize: 12,
        color: '#64748b',
        display: 'block',
        minHeight: 20,
        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 1 },
      }}
    >
      {value || '— Klik untuk isi'}
    </Box>
  );
}

export function BomItemList({ bomRows, updateBomRow, defaultExpanded = true }) {
  const defaultExpandAll = useMemo(
    () => bomRows.filter((r) => r.levelNum === 0 || r.levelNum === 1).map((r) => r.id),
    [bomRows]
  );
  const [expandedKeys, setExpandedKeys] = useState(() => new Set(defaultExpanded ? defaultExpandAll : []));

  React.useEffect(() => {
    if (defaultExpanded) {
      setExpandedKeys((prev) => {
        const next = new Set(prev);
        defaultExpandAll.forEach((k) => next.add(k));
        return next;
      });
    }
  }, [bomRows.length, defaultExpanded, defaultExpandAll]);

  const toggleExpand = useCallback((id) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const ordered = useMemo(
    () => buildOrderedList(bomRows, Array.from(expandedKeys)),
    [bomRows, expandedKeys]
  );

  const handleTypeChange = useCallback(
    (rowId, levelNum) => {
      updateBomRow?.(rowId, { levelNum, level: levelNum === 0 ? 'module' : levelNum === 1 ? 'submodule' : 'part' });
    },
    [updateBomRow]
  );

  return (
    <Box sx={{ fontFamily: 'var(--font-sans)' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          mb: 1.5,
          color: '#64748b',
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.05,
        }}
      >
        <ChevronRight sx={{ fontSize: 18 }} /> ITEM
      </Box>

      <Box
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {ordered.length === 0 ? (
          <Box sx={{ py: 4, px: 2, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            Belum ada item. Tambah Produk Jadi / Sub Assembly / Bahan Baku dari menu.
          </Box>
        ) : (
          ordered.map((row, index) => {
            const hasChildren = bomRows.some((r) => r.parentId === row.id);
            const isExpanded = expandedKeys.has(row.id);
            const indent = getIndent(bomRows, row);

            return (
              <Box
                key={row.id}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  py: 1.5,
                  px: 2,
                  pl: 2 + indent / 16,
                  borderBottom: index < ordered.length - 1 ? '1px dotted #e2e8f0' : 'none',
                  minHeight: 56,
                  '&:hover': { bgcolor: '#f8fafc' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 24, mt: 0.5 }}>
                  {hasChildren ? (
                    <Box
                      component="button"
                      type="button"
                      onClick={() => toggleExpand(row.id)}
                      sx={{
                        border: 0,
                        background: 'none',
                        cursor: 'pointer',
                        p: 0,
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover': { color: '#64748b' },
                      }}
                    >
                      {isExpanded ? <ExpandMore sx={{ fontSize: 22 }} /> : <ChevronRight sx={{ fontSize: 22 }} />}
                    </Box>
                  ) : (
                    <Box sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
                    </Box>
                  )}
                </Box>

                <Box
                  sx={{
                    width: 48,
                    minWidth: 48,
                    height: 48,
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {row.imageUrl ? (
                    <img src={row.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <NoPhotography sx={{ color: '#94a3b8', fontSize: 28 }} />
                  )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <EditableTitle
                    value={row.description || row.modul}
                    rowId={row.id}
                    onUpdate={updateBomRow}
                  />
                  <EditableCode value={row.partCode} rowId={row.id} onUpdate={updateBomRow} />
                </Box>

                <Box sx={{ flexShrink: 0, minWidth: 140, display: 'flex', alignItems: 'center' }}>
                  <Select
                    value={row.levelNum ?? 2}
                    onChange={(e) => handleTypeChange(row.id, Number(e.target.value))}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      height: 28,
                      minWidth: 120,
                      borderRadius: 2,
                      '& .MuiSelect-select': { py: 0.5, px: 1.5 },
                      ...(row.levelNum === 0 && { bgcolor: '#2563eb', color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' } }),
                      ...(row.levelNum === 1 && { bgcolor: '#059669', color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#059669' } }),
                      ...(row.levelNum === 2 && { bgcolor: '#d97706', color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d97706' } }),
                    }}
                  >
                    {ITEM_TYPES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>
                        {row.mod ? `${row.mod} ` : ''}{t.label}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
