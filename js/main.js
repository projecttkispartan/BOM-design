/**
 * BOM App — Init: toolbar, tabs, save/load, density, command palette, grid render.
 */

import { getState, getMetadata, setMetadata, getBomRows, setBomRows, getHardwareRows, setHardwareRows, loadStateFromStorage, saveStateToStorage, getDensity, setDensity, generateRowId, normalizeBomRow } from './state.js';
import { renderBomTable, renderHardwareTable } from './grid.js';
import { initKeyboardNavigation } from './keyboard.js';
import { initCommandPalette } from './commandPalette.js';

const BOM_TBODY_ID = 'bomTbody';
const HARDWARE_TBODY_ID = 'hardwareTbody';
const BOM_TABLE_ID = 'bomTable';

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.setAttribute('role', 'status');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function showLoading(show) {
    const overlay = document.getElementById('bomLoadingOverlay');
    if (overlay) {
        overlay.classList.toggle('is-visible', !!show);
        overlay.setAttribute('aria-hidden', show ? 'false' : 'true');
    }
}

function switchTab(tabId) {
    const bomGrid = document.getElementById('bomGrid');
    const hardwareGrid = document.getElementById('hardwareGrid');
    const tabBom = document.getElementById('tabBom');
    const tabHardware = document.getElementById('tabHardware');
    if (!bomGrid || !hardwareGrid) return;
    if (tabId === 'bom') {
        bomGrid.classList.remove('is-hidden');
        bomGrid.setAttribute('aria-hidden', 'false');
        hardwareGrid.classList.remove('is-visible');
        hardwareGrid.setAttribute('aria-hidden', 'true');
        if (tabBom) { tabBom.classList.add('active'); tabBom.setAttribute('aria-selected', 'true'); }
        if (tabHardware) { tabHardware.classList.remove('active'); tabHardware.setAttribute('aria-selected', 'false'); }
    } else {
        bomGrid.classList.add('is-hidden');
        bomGrid.setAttribute('aria-hidden', 'true');
        hardwareGrid.classList.add('is-visible');
        hardwareGrid.setAttribute('aria-hidden', 'false');
        if (tabBom) { tabBom.classList.remove('active'); tabBom.setAttribute('aria-selected', 'false'); }
        if (tabHardware) { tabHardware.classList.add('active'); tabHardware.setAttribute('aria-selected', 'true'); }
        renderHardwareTable(document.getElementById(HARDWARE_TBODY_ID));
    }
}

function applyDensity(density) {
    setDensity(density);
    const table = document.getElementById(BOM_TABLE_ID);
    if (table) table.setAttribute('data-density', density);
    renderBomTable(document.getElementById(BOM_TBODY_ID), density);
    showToast(`Kepadatan: ${density === 'compact' ? 'Compact' : density === 'standard' ? 'Standard' : 'Comfortable'}`);
}

function blankRow(overrides = {}) {
    return {
        id: generateRowId(),
        level: 'part',
        levelNum: 2,
        parentId: null,
        expanded: true,
        no: 1,
        mod: '',
        subMod: '',
        partCode: '',
        modul: '',
        description: '',
        material: '',
        kodeMat: '',
        sisiVen: '', sisiEdg: '', grVen: '', laminasi: '', glueArea: '', finNo: '', finishing: '', jnsKomp: '', wbs: '',
        workCenterOrRouting: '',
        ketProses: '',
        dimAP: '', dimAL: '', dimAT: '', dimBP: '', dimBL: '', dimBT: '', dimCP: '', dimCL: '', dimCT: '', dimDP: '', dimDL: '', dimDT: '',
        prodKode: '', prodP: '', prodL: '', prodT: '',
        qtyPart: '', qty: '', mLari: '', m2: '', volCut: '', volInv: '', procCode: '',
        ...overrides,
    };
}

function isDescendantOf(rows, rowId, ancestorId) {
    const byId = new Map(rows.map(r => [r.id, r]));
    let r = byId.get(rowId);
    while (r && r.parentId) {
        if (r.parentId === ancestorId) return true;
        r = byId.get(r.parentId);
    }
    return false;
}

function getInsertAfterIndex(rows, parent) {
    const idx = rows.findIndex(r => r.id === parent.id);
    if (idx < 0) return rows.length - 1;
    let last = idx;
    for (let i = idx + 1; i < rows.length; i++) {
        if (!isDescendantOf(rows, rows[i].id, parent.id)) return last;
        last = i;
    }
    return last;
}

function renumberRows(rows) {
    return rows.map((r, i) => ({ ...r, no: i + 1 }));
}

function addModul() {
    const rows = getBomRows().map(normalizeBomRow);
    const newRow = blankRow({
        level: 'module',
        levelNum: 0,
        parentId: null,
        mod: String(rows.length + 1),
        modul: 'MODUL BARU',
        description: 'MODUL BARU',
    });
    const next = renumberRows([...rows, newRow]);
    setBomRows(next);
    renderBomTable(document.getElementById(BOM_TBODY_ID), getDensity());
    showToast('Modul ditambahkan');
}

function addSubModul() {
    const rows = getBomRows().map(normalizeBomRow);
    const parent = [...rows].reverse().find(r => r.levelNum === 0);
    if (!parent) {
        showToast('Tambah Modul dulu', 'error');
        return;
    }
    const insertAfter = getInsertAfterIndex(rows, parent);
    const siblings = rows.filter(r => r.parentId === parent.id && (r.levelNum ?? 2) === 1);
    const nextNum = siblings.length + 1;
    const newRow = blankRow({
        level: 'submodule',
        levelNum: 1,
        parentId: parent.id,
        mod: `${parent.mod}.${nextNum}`,
        subMod: `${parent.mod}.${nextNum}`,
        modul: parent.modul || 'MODUL BARU',
        description: 'SUB MODUL BARU',
    });
    const inserted = [...rows.slice(0, insertAfter + 1), newRow, ...rows.slice(insertAfter + 1)];
    setBomRows(renumberRows(inserted));
    renderBomTable(document.getElementById(BOM_TBODY_ID), getDensity());
    showToast('Sub Modul ditambahkan');
}

function addPart() {
    const rows = getBomRows().map(normalizeBomRow);
    const parent = [...rows].reverse().find(r => r.levelNum === 1 || r.levelNum === 0);
    if (!parent) {
        showToast('Tambah Modul atau Sub Modul dulu', 'error');
        return;
    }
    const insertAfter = getInsertAfterIndex(rows, parent);
    const siblings = rows.filter(r => r.parentId === parent.id && (r.levelNum ?? 2) === 2);
    const nextNum = siblings.length + 1;
    const modCode = parent.mod ? `${parent.mod}.${nextNum}` : String(nextNum);
    const newRow = blankRow({
        level: 'part',
        levelNum: 2,
        parentId: parent.id,
        mod: modCode,
        subMod: modCode,
        modul: parent.modul || '',
        description: 'PART BARU',
    });
    const inserted = [...rows.slice(0, insertAfter + 1), newRow, ...rows.slice(insertAfter + 1)];
    setBomRows(renumberRows(inserted));
    renderBomTable(document.getElementById(BOM_TBODY_ID), getDensity());
    showToast('Part ditambahkan');
}

function saveDraft() {
    showLoading(true);
    setTimeout(() => {
        const ok = saveStateToStorage();
        showLoading(false);
        if (ok) showToast('Draft disimpan', 'success');
        else showToast('Gagal menyimpan', 'error');
    }, 300);
}

function loadDraft() {
    const ok = loadStateFromStorage();
    if (ok) {
        renderBomTable(document.getElementById(BOM_TBODY_ID), getDensity());
        renderHardwareTable(document.getElementById(HARDWARE_TBODY_ID));
        bindMetadata();
        showToast('Draft dimuat');
    }
}

function exportJson() {
    const state = getState();
    const blob = new Blob([JSON.stringify({ metadata: state.metadata, bomRows: state.bomRows, hardwareRows: state.hardwareRows }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bom-draft-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('BOM diekspor ke file');
}

function importJson() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (data.metadata) setMetadata(data.metadata);
                if (Array.isArray(data.bomRows)) setBomRows(data.bomRows);
                if (Array.isArray(data.hardwareRows)) setHardwareRows(data.hardwareRows);
                renderBomTable(document.getElementById(BOM_TBODY_ID), getDensity());
                renderHardwareTable(document.getElementById(HARDWARE_TBODY_ID));
                bindMetadata();
                showToast('BOM dimuat dari file');
            } catch (_) {
                showToast('File tidak valid', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function bindMetadata() {
    const meta = getMetadata();
    const ids = ['metaCustomer', 'metaItemType', 'metaWood', 'metaCoating', 'metaItemDim', 'metaVolM3'];
    const keys = ['customer', 'itemType', 'wood', 'coatingColor', 'itemDim', 'volM3'];
    keys.forEach((key, i) => {
        const el = document.getElementById(ids[i]);
        if (el) {
            el.value = meta[key] ?? '';
            el.oninput = () => setMetadata({ [key]: el.value });
        }
    });
}

function bindTabs() {
    document.querySelectorAll('.tab[data-tab]').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab')));
    });
}

function init() {
    loadStateFromStorage();
    const density = getDensity();
    applyDensity(density);

    const bomTbody = document.getElementById(BOM_TBODY_ID);
    const hwTbody = document.getElementById(HARDWARE_TBODY_ID);
    renderBomTable(bomTbody, density);
    renderHardwareTable(hwTbody);

    bindMetadata();
    bindTabs();

    initKeyboardNavigation(BOM_TABLE_ID, 'hardwareTable');

    initCommandPalette({
        addModul,
        addSubModul,
        addPart,
        saveDraft,
        switchTab,
        setDensity: (d) => applyDensity(d),
        exportJson,
        importJson,
    });

    document.getElementById('btnAddModul')?.addEventListener('click', addModul);
    document.getElementById('btnAddSubModul')?.addEventListener('click', addSubModul);
    document.getElementById('btnAddPart')?.addEventListener('click', addPart);
    document.getElementById('btnSaveDraft')?.addEventListener('click', saveDraft);

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveDraft(); }
    });
}

init();
