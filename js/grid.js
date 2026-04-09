/**
 * Render BOM and Hardware tables from state.
 * Tree hierarchy via level + indent classes; sticky cols and group headers preserved.
 */

import { getBomRows, getHardwareRows, setBomRows, setHardwareRows, normalizeBomRow, getUniqueModulNames } from './state.js';
import { recomputeRow } from './calculations.js';

const BOM_FIELDS = [
    'no', 'mod', 'subMod', 'partCode', 'modul', 'description',
    'material', 'kodeMat', 'sisiVen', 'sisiEdg', 'grVen', 'laminasi', 'glueArea', 'finNo', 'finishing', 'jnsKomp', 'wbs',
    'workCenterOrRouting',
    'ketProses',
    'dimAP', 'dimAL', 'dimAT', 'dimBP', 'dimBL', 'dimBT', 'dimCP', 'dimCL', 'dimCT', 'dimDP', 'dimDL', 'dimDT',
    'prodKode', 'prodP', 'prodL', 'prodT',
    'qtyPart', 'qty', 'mLari', 'm2', 'volCut', 'volInv', 'procCode',
];

const BOM_NUMERIC = new Set(['no', 'dimAP', 'dimAL', 'dimAT', 'dimBP', 'dimBL', 'dimBT', 'dimCP', 'dimCL', 'dimCT', 'dimDP', 'dimDL', 'dimDT', 'prodP', 'prodL', 'prodT', 'qtyPart', 'qty', 'mLari', 'm2', 'volCut', 'volInv', 'finNo']);
const BOM_CENTER = new Set(['no', 'mod', 'subMod', 'finNo', 'prodKode', 'qtyPart', 'qty']);
const BOM_RIGHT = new Set(['dimAP', 'dimAL', 'dimAT', 'dimBP', 'dimBL', 'dimBT', 'dimCP', 'dimCL', 'dimCT', 'dimDP', 'dimDL', 'dimDT', 'prodP', 'prodL', 'prodT', 'mLari', 'm2', 'volCut', 'volInv']);

const HARDWARE_FIELDS = ['no', 'partCode', 'description', 'material', 'jenisHardware', 'qty', 'keterangan'];

let onBomCellChange;
let onHardwareCellChange;

export function setOnBomCellChange(fn) {
    onBomCellChange = fn;
}

export function setOnHardwareCellChange(fn) {
    onHardwareCellChange = fn;
}

function cellClass(field) {
    const c = [];
    if (BOM_NUMERIC.has(field)) c.push('num');
    if (BOM_CENTER.has(field)) c.push('text-center');
    if (BOM_RIGHT.has(field)) c.push('text-right');
    return c.join(' ');
}

function applyIndent(td, row, field) {
    if (field !== 'modul' && field !== 'description') return;
    const lv = row.levelNum ?? (row.level === 'module' ? 0 : row.level === 'submodule' ? 1 : 2);
    if (lv === 0) return;
    if (lv === 1) td.classList.add('indent-1');
    if (lv === 2) td.classList.add('indent-2');
}

/** Baris terlihat jika semua ancestor expanded */
function getVisibleRows(rows) {
    const byId = new Map(rows.map(r => [r.id, normalizeBomRow(r)]));
    function allAncestorsExpanded(r) {
        let pid = r.parentId;
        while (pid) {
            const p = byId.get(pid);
            if (!p || p.expanded === false) return false;
            pid = p.parentId;
        }
        return true;
    }
    return rows.filter(r => allAncestorsExpanded(r));
}

/** Punya anak (untuk tampilkan expand/collapse) */
function hasChildren(rowId, rows) {
    return rows.some(r => r.parentId === rowId);
}

function getLevelLabel(row) {
    const lv = row.levelNum ?? (row.level === 'module' ? 0 : row.level === 'submodule' ? 1 : 2);
    if (lv === 0) return { text: 'MODUL', cls: 'level-pill level-modul' };
    if (lv === 1) return { text: 'SUB MODUL', cls: 'level-pill level-submodul' };
    return { text: 'PART', cls: 'level-pill level-part' };
}

export function renderBomTable(tbody, density) {
    let rows = getBomRows().map(normalizeBomRow);
    const visible = getVisibleRows(rows);
    tbody.innerHTML = '';
    const table = tbody.closest('table');
    if (table) table.setAttribute('data-density', density || 'compact');

    if (!rows.length) {
        const empty = document.getElementById('bomEmptyState');
        if (empty) empty.style.display = 'block';
        return;
    }
    const emptyEl = document.getElementById('bomEmptyState');
    if (emptyEl) emptyEl.style.display = 'none';

    const modulOptions = getUniqueModulNames();
    const datalist = document.getElementById('datalist-modul');
    if (datalist) {
        datalist.innerHTML = '';
        modulOptions.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            datalist.appendChild(opt);
        });
    }

    visible.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-row-id', row.id);
        tr.setAttribute('data-row-index', String(rows.indexOf(row)));
        const lv = row.levelNum ?? (row.level === 'module' ? 0 : row.level === 'submodule' ? 1 : 2);
        if (lv === 0) tr.classList.add('row-module');
        if (lv === 1) tr.classList.add('row-submodul');
        if (lv === 2) tr.classList.add('row-part');

        BOM_FIELDS.forEach(field => {
            let td;
            if (field === 'modul') {
                td = renderModulCell(row, hasChildren(row.id, rows), modulOptions);
            } else {
                td = renderBomCell(row, field, row[field]);
            }
            applyIndent(td, row, field);
            tr.appendChild(td);
        });

        if (row.level !== 'module' || lv !== 0) {
            tr.querySelectorAll('td[contenteditable="true"]').forEach(cell => {
                cell.addEventListener('blur', () => commitBomCell(cell));
                cell.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        cell.blur();
                    }
                });
            });
        }
        tbody.appendChild(tr);
    });
}

function renderModulCell(row, hasChildren, modulOptions) {
    const td = document.createElement('td');
    td.setAttribute('data-row-id', row.id);
    td.setAttribute('data-field', 'modul');
    const lv = row.levelNum ?? (row.level === 'module' ? 0 : row.level === 'submodule' ? 1 : 2);
    const editable = lv !== 0;
    if (editable) {
        td.setAttribute('contenteditable', 'true');
        td.setAttribute('tabindex', '0');
    }

    const wrap = document.createElement('div');
    wrap.className = 'cell-modul-wrap';

    if (lv === 0 || lv === 1) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-expand';
        btn.setAttribute('aria-label', row.expanded ? 'Collapse' : 'Expand');
        btn.innerHTML = row.expanded ? '&#9660;' : '&#9654;';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleExpand(row.id);
        });
        wrap.appendChild(btn);
    } else {
        const span = document.createElement('span');
        span.className = 'btn-expand-placeholder';
        span.textContent = '\u2013';
        wrap.appendChild(span);
    }

    const pill = document.createElement('span');
    const { text, cls } = getLevelLabel(row);
    pill.className = cls;
    pill.textContent = text;
    wrap.appendChild(pill);

    if (editable) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = row.modul ?? '';
        input.className = 'cell-modul-input';
        input.setAttribute('list', 'datalist-modul');
        input.placeholder = 'Pilih atau ketik modul…';
        input.addEventListener('change', () => {
            const rows = getBomRows();
            const r = rows.find(x => x.id === row.id);
            if (r) { r.modul = input.value.trim(); setBomRows([...rows]); }
        });
        wrap.appendChild(input);
    } else {
        const textEl = document.createElement('span');
        textEl.textContent = row.modul ?? '';
        textEl.className = 'cell-modul-text';
        wrap.appendChild(textEl);
    }

    td.appendChild(wrap);
    return td;
}

function toggleExpand(rowId) {
    const rows = getBomRows().map(normalizeBomRow);
    const r = rows.find(x => x.id === rowId);
    if (!r) return;
    r.expanded = !r.expanded;
    setBomRows([...rows]);
    const tbody = document.getElementById('bomTbody');
    const table = tbody?.closest('table');
    renderBomTable(tbody, table?.getAttribute('data-density'));
}

function renderBomCell(row, field, value) {
    const computed = ['volCut', 'volInv', 'mLari', 'm2'].includes(field) ? (row[field] ?? '') : value;
    const lv = row.levelNum ?? (row.level === 'module' ? 0 : row.level === 'submodule' ? 1 : 2);
    const editable = lv !== 0;
    const td = document.createElement('td');
    td.setAttribute('data-row-id', row.id);
    td.setAttribute('data-field', field);
    if (editable) {
        td.setAttribute('contenteditable', 'true');
        td.setAttribute('tabindex', '0');
    }
    const cls = cellClass(field);
    if (cls) td.className = cls;
    td.textContent = computed ?? '';
    td.setAttribute('data-value', String(computed ?? ''));
    return td;
}

function commitBomCell(cell) {
    const rowId = cell.getAttribute('data-row-id');
    const field = cell.getAttribute('data-field');
    const newVal = cell.textContent.trim();
    const rows = getBomRows();
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    const oldVal = row[field];
    if (String(oldVal ?? '') === newVal) return;
    row[field] = newVal;
    const updated = recomputeRow(row);
    const idx = rows.findIndex(r => r.id === rowId);
    rows[idx] = updated;
    setBomRows([...rows]);
    if (onBomCellChange) onBomCellChange(updated, field);
    const tr = cell.closest('tr');
    if (tr) {
        ['volCut', 'volInv', 'mLari', 'm2'].forEach(f => {
            const td = tr.querySelector(`td[data-field="${f}"]`);
            if (td) { td.textContent = updated[f] ?? ''; td.setAttribute('data-value', String(updated[f] ?? '')); }
        });
    }
}

export function renderHardwareTable(tbody) {
    const rows = getHardwareRows();
    tbody.innerHTML = '';
    const emptyEl = document.getElementById('hardwareEmptyState');
    if (!rows.length) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    rows.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-row-id', row.id);
        tr.setAttribute('data-row-index', String(idx));
        HARDWARE_FIELDS.forEach(field => {
            const td = document.createElement('td');
            td.setAttribute('data-row-id', row.id);
            td.setAttribute('data-field', field);
            td.setAttribute('contenteditable', 'true');
            td.setAttribute('tabindex', '0');
            if (field === 'no') td.classList.add('text-center');
            if (field === 'qty') td.classList.add('num', 'text-center');
            td.textContent = row[field] ?? '';
            td.addEventListener('blur', () => commitHardwareCell(td));
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function commitHardwareCell(cell) {
    const rowId = cell.getAttribute('data-row-id');
    const field = cell.getAttribute('data-field');
    const newVal = cell.textContent.trim();
    const rows = getHardwareRows();
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    row[field] = newVal;
    setHardwareRows([...rows]);
    if (onHardwareCellChange) onHardwareCellChange(row, field);
}

export function getBomCellCoordinates() {
    const tbody = document.getElementById('bomTbody');
    if (!tbody) return { rows: [], cellMap: new Map() };
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const cellMap = new Map();
    rows.forEach((tr, ri) => {
        const cells = Array.from(tr.querySelectorAll('td[contenteditable="true"]'));
        cells.forEach((td, ci) => {
            cellMap.set(`${ri}-${ci}`, td);
        });
    });
    return { rows, cellMap, editableColCount: BOM_FIELDS.filter(f => f !== 'no').length };
}

export function getBomEditableCellsInOrder() {
    const tbody = document.getElementById('bomTbody');
    if (!tbody) return [];
    return Array.from(tbody.querySelectorAll('td[contenteditable="true"]'));
}

export { BOM_FIELDS, HARDWARE_FIELDS };
