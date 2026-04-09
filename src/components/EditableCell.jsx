import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, TextField, MenuItem, Select, FormControl } from '@mui/material';

const EMPTY_DISPLAY = '—';
const NA_PLACEHOLDERS = ['#n/a', 'n/a', '#na'];
function isEmptyOrNa(val) {
  if (val == null || val === '') return true;
  const s = String(val).trim().toLowerCase();
  return NA_PLACEHOLDERS.includes(s) || s === '';
}

/**
 * EditableCell — sel tabel dengan perilaku mirip Excel.
 * - Single-click: fokus (border); parent mengatur fokus sel.
 * - Double-click / F2: masuk mode edit.
 * - Escape: batalkan edit, nilai kembali ke sebelumnya.
 * - Tab / Enter: konfirmasi edit dan pindah (onConfirm dipanggil, parent pindah fokus).
 * - Tipe: text | number | dropdown.
 * - Validasi: angka tidak negatif; required tidak boleh kosong.
 */
export function EditableCell({
  value,
  field,
  rowId,
  onUpdate,
  type = 'text',
  align = 'left',
  emptyColor = '#4a5568',
  isFocused = false,
  isEditing = false,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
  options = [],
  required = false,
  min,
  inputProps,
  emptyDisplay,
  sx = {},
}) {
  const [local, setLocal] = useState(value ?? '');
  const prevValueRef = useRef(value ?? '');
  const inputRef = useRef(null);

  useEffect(() => {
    setLocal(value ?? '');
    prevValueRef.current = value ?? '';
  }, [value]);

  const commit = useCallback(
    (nextVal) => {
      let v = type === 'number' ? (parseFloat(String(nextVal).replace(',', '.')) ?? '') : String(nextVal ?? '').trim();
      if (type === 'number' && min != null && v !== '' && Number(v) < min) v = String(min);
      if (required && (v === '' || v == null)) v = String(value ?? '').trim();
      if (String(v) !== String(value ?? '')) onUpdate?.(rowId, { [field]: v });
      onConfirmEdit?.();
    },
    [field, rowId, onUpdate, type, min, required, value, onConfirmEdit]
  );

  const handleBlur = useCallback(() => {
    commit(local);
  }, [local, commit]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setLocal(prevValueRef.current);
        onCancelEdit?.();
        inputRef.current?.blur();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        commit(local);
        onConfirmEdit?.({ key: 'Enter' });
        return;
      }
      if (e.key === 'Tab') {
        commit(local);
        onConfirmEdit?.({ key: 'Tab' });
      }
    },
    [local, commit, onCancelEdit, onConfirmEdit]
  );

  const handleDoubleClick = useCallback(() => {
    onStartEdit?.();
  }, [onStartEdit]);

  const handleClick = useCallback(() => {
    if (isFocused && !isEditing) onStartEdit?.();
  }, [isFocused, isEditing, onStartEdit]);

  const isEmpty = isEmptyOrNa(value);
  const displayValue = isEmpty ? (emptyDisplay ?? EMPTY_DISPLAY) : String(value).trim();
  const showBorder = isFocused || isEditing;
  const borderColor = isEditing ? '#38bdf8' : 'rgba(56, 189, 248, 0.6)';

  if (isEditing) {
    const commonInput = {
      size: 'small',
      value: local,
      onChange: (e) => setLocal(e.target.value),
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      inputRef,
      autoFocus: true,
      fullWidth: true,
      inputProps: {
        style: { textAlign: align },
        min: type === 'number' && min != null ? min : undefined,
        ...inputProps,
      },
      sx: {
        '& .MuiOutlinedInput-root': {
          bgcolor: 'rgba(255,255,255,0.08)',
          color: '#fff',
          borderRadius: 1,
          '& fieldset': { borderColor: borderColor, borderWidth: 1.5 },
        },
        '& .MuiInputBase-input': { fontSize: 12 },
        minWidth: 60,
        ...sx,
      },
    };

    if (type === 'dropdown' && options.length > 0) {
      return (
        <FormControl fullWidth size="small" sx={commonInput.sx}>
          <Select
            value={local}
            onChange={(e) => {
              setLocal(e.target.value);
              commit(e.target.value);
              onConfirmEdit?.();
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
            autoFocus
            MenuProps={{ disablePortal: true }}
            sx={{ fontSize: 12, color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor } }}
          >
            {options.map((opt) => (
              <MenuItem key={opt.value ?? opt} value={opt.value ?? opt}>
                {opt.label ?? opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    return (
      <TextField
        {...commonInput}
        type={type === 'number' ? 'number' : 'text'}
      />
    );
  }

  return (
    <Box
      role="gridcell"
      data-editable-cell
      tabIndex={isFocused ? 0 : -1}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      sx={{
        cursor: 'text',
        minHeight: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        px: 0.75,
        py: 0.5,
        borderRadius: 1,
        color: isEmpty ? emptyColor : undefined,
        outline: 'none',
        border: '1px solid transparent',
        ...(showBorder && { borderColor, borderWidth: 1.5, borderStyle: 'solid' }),
        '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
        ...sx,
      }}
    >
      {displayValue}
    </Box>
  );
}
