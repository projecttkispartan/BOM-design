/**
 * Keyboard navigation (AG Grid / Handsontable style): Arrow, Tab, Enter, F2, Home/End, Page Up/Down, Ctrl+C/V.
 */

function getEditableCells(table) {
    if (!table) return [];
    return Array.from(table.querySelectorAll('tbody td[contenteditable="true"]'));
}

function getCellAt(table, rowIdx, colIdx) {
    const rows = table.querySelectorAll('tbody tr');
    const tr = rows[rowIdx];
    if (!tr) return null;
    const cells = tr.querySelectorAll('td[contenteditable="true"]');
    return cells[colIdx] || null;
}

export function initKeyboardNavigation(bomTableId, hardwareTableId) {
    const bomTable = document.getElementById(bomTableId);
    const hwTable = document.getElementById(hardwareTableId);

    function handleKeydown(e) {
        const target = e.target;
        if (!target.matches || !target.matches('td[contenteditable="true"]')) return;
        const tbl = target.closest('table');
        if (!tbl || (tbl.id !== bomTableId && tbl.id !== hardwareTableId)) return;

        if (!getEditableCells(tbl).length) return;

        const rows = Array.from(tbl.querySelectorAll('tbody tr'));
        let rowIdx = -1, colIdx = -1, maxCol = 0;
        rows.forEach((tr, ri) => {
            const rowCells = tr.querySelectorAll('td[contenteditable="true"]');
            const ci = Array.from(rowCells).indexOf(target);
            if (ci >= 0) { rowIdx = ri; colIdx = ci; maxCol = Math.max(maxCol, rowCells.length); }
        });
        if (rowIdx < 0) return;

        const rowCount = rows.length;
        const colCount = rows[rowIdx].querySelectorAll('td[contenteditable="true"]').length;

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (colIdx < colCount - 1) getCellAt(tbl, rowIdx, colIdx + 1)?.focus();
            return;
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (colIdx > 0) getCellAt(tbl, rowIdx, colIdx - 1)?.focus();
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            for (let r = rowIdx + 1; r < rowCount; r++) {
                const next = getCellAt(tbl, r, Math.min(colIdx, rows[r].querySelectorAll('td[contenteditable="true"]').length - 1));
                if (next) { next.focus(); return; }
            }
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            for (let r = rowIdx - 1; r >= 0; r--) {
                const next = getCellAt(tbl, r, Math.min(colIdx, rows[r].querySelectorAll('td[contenteditable="true"]').length - 1));
                if (next) { next.focus(); return; }
            }
            return;
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                if (colIdx > 0) getCellAt(tbl, rowIdx, colIdx - 1)?.focus();
                else if (rowIdx > 0) {
                    const prevRowCells = rows[rowIdx - 1].querySelectorAll('td[contenteditable="true"]');
                    prevRowCells[prevRowCells.length - 1]?.focus();
                }
            } else {
                if (colIdx < colCount - 1) getCellAt(tbl, rowIdx, colIdx + 1)?.focus();
                else if (rowIdx < rowCount - 1) getCellAt(tbl, rowIdx + 1, 0)?.focus();
            }
            return;
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (rowIdx < rowCount - 1) getCellAt(tbl, rowIdx + 1, colIdx)?.focus();
            return;
        }
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            if (rowIdx > 0) getCellAt(tbl, rowIdx - 1, colIdx)?.focus();
            return;
        }
        if (e.key === 'Home' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            getCellAt(tbl, rowIdx, 0)?.focus();
            return;
        }
        if (e.key === 'End' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            getCellAt(tbl, rowIdx, colCount - 1)?.focus();
            return;
        }
        if (e.key === 'PageDown') {
            e.preventDefault();
            const nextRow = Math.min(rowIdx + 10, rowCount - 1);
            getCellAt(tbl, nextRow, Math.min(colIdx, rows[nextRow].querySelectorAll('td[contenteditable="true"]').length - 1))?.focus();
            return;
        }
        if (e.key === 'PageUp') {
            e.preventDefault();
            const nextRow = Math.max(rowIdx - 10, 0);
            getCellAt(tbl, nextRow, Math.min(colIdx, rows[nextRow].querySelectorAll('td[contenteditable="true"]').length - 1))?.focus();
            return;
        }
        if (e.key === 'F2') {
            e.preventDefault();
            target.focus();
            const range = document.createRange();
            range.selectNodeContents(target);
            window.getSelection()?.removeAllRanges();
            window.getSelection()?.addRange(range);
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            const text = target.textContent || '';
            if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text);
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            navigator.clipboard?.readText().then(t => {
                target.textContent = t;
                target.dispatchEvent(new Event('blur', { bubbles: true }));
            }).catch(() => {});
            return;
        }
    }

    function focusSelect(e) {
        if (e.target.matches('td[contenteditable="true"]')) {
            const range = document.createRange();
            range.selectNodeContents(e.target);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }

    if (bomTable) {
        bomTable.addEventListener('keydown', handleKeydown);
        bomTable.addEventListener('focusin', focusSelect);
    }
    if (hwTable) {
        hwTable.addEventListener('keydown', handleKeydown);
        hwTable.addEventListener('focusin', focusSelect);
    }

    return () => {
        bomTable?.removeEventListener('keydown', handleKeydown);
        bomTable?.removeEventListener('focusin', focusSelect);
        hwTable?.removeEventListener('keydown', handleKeydown);
        hwTable?.removeEventListener('focusin', focusSelect);
    };
}
