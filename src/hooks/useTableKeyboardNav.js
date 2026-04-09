import { useState, useCallback, useRef } from 'react';

/**
 * useTableKeyboardNav — navigasi keyboard seperti Excel.
 * @param {Object} options
 * @param {number} options.rowCount
 * @param {string[]} options.columnKeys — urutan kolom (key yang bisa difokus)
 * @param {(rowIndex: number) => boolean} [options.isRowVisible] — false jika row collapsed/hidden
 * @param {(rowIndex: number) => void} [options.onInsertRow]
 * @param {(rowIndex: number) => void} [options.onDeleteRow]
 * @param {(rowIndex: number) => void} [options.onCopyRow]
 * @param {(rowIndex: number) => void} [options.onPasteRow]
 * @param {(rowIndex: number) => void} [options.onExpandRow]
 * @param {(rowIndex: number) => void} [options.onCollapseRow]
 * @param {(rowIndex: number, colKey: string) => void} [options.onStartEdit]
 * @param {(rowIndex: number, colKey: string) => void} [options.onClearCell] — Delete key clears cell content
 */
export function useTableKeyboardNav(options) {
  const {
    rowCount,
    columnKeys = [],
    isRowVisible = () => true,
    onInsertRow,
    onDeleteRow,
    onCopyRow,
    onPasteRow,
    onExpandRow,
    onCollapseRow,
    onStartEdit,
    onClearCell,
  } = options;

  const [focusedCell, setFocusedCell] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const containerRef = useRef(null);

  const colCount = columnKeys.length;
  const getNextVisibleRow = useCallback(
    (fromRow, direction) => {
      let r = fromRow + direction;
      while (r >= 0 && r < rowCount) {
        if (isRowVisible(r)) return r;
        r += direction;
      }
      return null;
    },
    [rowCount, isRowVisible]
  );

  const getNextColIndex = useCallback(
    (colKey, direction) => {
      const i = columnKeys.indexOf(colKey);
      if (i < 0) return 0;
      const next = i + direction;
      if (next < 0) return 0;
      if (next >= colCount) return colCount - 1;
      return next;
    },
    [columnKeys, colCount]
  );

  const handleKeyDown = useCallback(
    (e) => {
      const { rowIndex, colKey } = focusedCell ?? {};
      const isEditing = editingCell != null;

      if (isEditing) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setEditingCell(null);
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          return;
        }
      }

      if (!focusedCell && e.key !== 'Tab' && e.key !== 'Enter') return;

      switch (e.key) {
        case 'Tab': {
          e.preventDefault();
          if (isEditing) return;
          if (rowIndex == null) {
            if (rowCount > 0 && colCount > 0) setFocusedCell({ rowIndex: 0, colKey: columnKeys[0] });
            return;
          }
          const nextColIdx = getNextColIndex(colKey, e.shiftKey ? -1 : 1);
          if (e.shiftKey && nextColIdx === 0 && columnKeys[0] === colKey) {
            const prevRow = getNextVisibleRow(rowIndex, -1);
            if (prevRow != null) setFocusedCell({ rowIndex: prevRow, colKey: columnKeys[colCount - 1] });
            else setFocusedCell({ rowIndex, colKey: columnKeys[0] });
          } else if (!e.shiftKey && nextColIdx === colCount - 1 && columnKeys[nextColIdx] === colKey) {
            const nextRow = getNextVisibleRow(rowIndex, 1);
            if (nextRow != null) setFocusedCell({ rowIndex: nextRow, colKey: columnKeys[0] });
            else setFocusedCell({ rowIndex, colKey: columnKeys[nextColIdx] });
          } else {
            setFocusedCell({ rowIndex, colKey: columnKeys[nextColIdx] });
          }
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (isEditing) return;
          if (e.shiftKey) {
            const prevRow = getNextVisibleRow(rowIndex, -1);
            if (prevRow != null) setFocusedCell({ rowIndex: prevRow, colKey });
          } else {
            const nextRow = getNextVisibleRow(rowIndex, 1);
            if (nextRow != null) setFocusedCell({ rowIndex: nextRow, colKey });
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          if (isEditing) return;
          const prevRow = getNextVisibleRow(rowIndex, -1);
          if (prevRow != null) setFocusedCell({ rowIndex: prevRow, colKey });
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          if (isEditing) return;
          const nextRow = getNextVisibleRow(rowIndex, 1);
          if (nextRow != null) setFocusedCell({ rowIndex: nextRow, colKey });
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (isEditing) return;
          const leftIdx = getNextColIndex(colKey, -1);
          if (leftIdx >= 0) setFocusedCell({ rowIndex, colKey: columnKeys[leftIdx] });
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (isEditing) return;
          const rightIdx = getNextColIndex(colKey, 1);
          if (rightIdx < colCount) setFocusedCell({ rowIndex, colKey: columnKeys[rightIdx] });
          break;
        }
        case 'F2': {
          e.preventDefault();
          if (focusedCell && onStartEdit) {
            setEditingCell(focusedCell);
            onStartEdit(focusedCell.rowIndex, focusedCell.colKey);
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          if (isEditing) setEditingCell(null);
          else setFocusedCell(null);
          break;
        }
        case 'Insert':
        case 'Control': // Ctrl+Enter
          if (e.ctrlKey && (e.key === 'Enter' || e.key === 'Insert')) {
            e.preventDefault();
            if (onInsertRow && rowIndex != null) onInsertRow(rowIndex);
          }
          break;
        case 'Delete':
          if (!e.ctrlKey && !e.metaKey && rowIndex != null) {
            e.preventDefault();
            if (onClearCell) onClearCell(rowIndex, colKey);
            else if (onDeleteRow) onDeleteRow(rowIndex);
          }
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            if (onCopyRow && rowIndex != null) onCopyRow(rowIndex);
          }
          break;
        case 'v':
          if (e.ctrlKey || e.metaKey) {
            if (onPasteRow && rowIndex != null) onPasteRow(rowIndex);
          }
          break;
        default:
          break;
      }
    },
    [
      focusedCell,
      editingCell,
      rowCount,
      colCount,
      columnKeys,
      getNextVisibleRow,
      getNextColIndex,
      onInsertRow,
      onDeleteRow,
      onCopyRow,
      onPasteRow,
      onStartEdit,
      onClearCell,
    ]
  );

  /** Move focus to adjacent cell after commit (Tab = right, Enter = down). */
  const focusAdjacent = useCallback(
    (rowIndex, colKey, direction) => {
      const isRight = direction === 'right';
      const isDown = direction === 'down';
      const isLeft = direction === 'left';
      const isUp = direction === 'up';
      if (isRight || isLeft) {
        const nextColIdx = getNextColIndex(colKey, isRight ? 1 : -1);
        const nextCol = columnKeys[nextColIdx];
        if (nextCol !== colKey) setFocusedCell({ rowIndex, colKey: nextCol });
      } else if (isDown || isUp) {
        const nextRow = getNextVisibleRow(rowIndex, isDown ? 1 : -1);
        if (nextRow != null) setFocusedCell({ rowIndex: nextRow, colKey });
      }
    },
    [columnKeys, getNextColIndex, getNextVisibleRow]
  );

  const focusCell = useCallback((rowIndex, colKey) => {
    setFocusedCell({ rowIndex, colKey });
  }, []);

  const startEdit = useCallback((rowIndex, colKey) => {
    setEditingCell({ rowIndex, colKey });
  }, []);

  const stopEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const isCellFocused = useCallback(
    (rowIndex, colKey) => {
      if (!focusedCell) return false;
      return focusedCell.rowIndex === rowIndex && focusedCell.colKey === colKey;
    },
    [focusedCell]
  );

  const isCellEditing = useCallback(
    (rowIndex, colKey) => {
      if (!editingCell) return false;
      return editingCell.rowIndex === rowIndex && editingCell.colKey === colKey;
    },
    [editingCell]
  );

  return {
    containerRef,
    focusedCell,
    editingCell,
    setFocusedCell,
    focusCell,
    startEdit,
    stopEdit,
    setEditingCell,
    handleKeyDown,
    isCellFocused,
    isCellEditing,
    focusAdjacent,
  };
}
