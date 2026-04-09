/**
 * Command palette (Ctrl+K / Cmd+K). Linear/Notion style: fuzzy filter, shortcuts, recent actions.
 */

const RECENT_KEY = 'bom-command-palette-recent';
const MAX_RECENT = 5;

const COMMANDS = [
    { id: 'add-modul', label: 'Tambah Modul', shortcut: 'Add Modul', action: 'addModul', keywords: 'tambah modul add' },
    { id: 'add-submodul', label: 'Tambah Sub Modul', shortcut: '', action: 'addSubModul', keywords: 'tambah sub modul' },
    { id: 'add-part', label: 'Tambah Part', shortcut: '', action: 'addPart', keywords: 'tambah part' },
    { id: 'save-draft', label: 'Simpan Draft', shortcut: 'Ctrl+S', action: 'saveDraft', keywords: 'simpan save draft' },
    { id: 'tab-bom', label: 'Beralih ke BOM Kayu & Komponen', shortcut: 'Tab 1', action: 'switchTab', payload: 'bom', keywords: 'bom kayu komponen' },
    { id: 'tab-hardware', label: 'Beralih ke Hardware & Fittings', shortcut: 'Tab 2', action: 'switchTab', payload: 'hardware', keywords: 'hardware fittings' },
    { id: 'density-compact', label: 'Kepadatan: Compact', shortcut: '', action: 'setDensity', payload: 'compact', keywords: 'density compact padat' },
    { id: 'density-standard', label: 'Kepadatan: Standard', shortcut: '', action: 'setDensity', payload: 'standard', keywords: 'density standard' },
    { id: 'density-comfortable', label: 'Kepadatan: Comfortable', shortcut: '', action: 'setDensity', payload: 'comfortable', keywords: 'density comfortable nyaman' },
    { id: 'export-json', label: 'Export BOM ke file JSON', shortcut: '', action: 'exportJson', keywords: 'export json simpan file' },
    { id: 'import-json', label: 'Import BOM dari file JSON', shortcut: '', action: 'importJson', keywords: 'import json load muat' },
];

function fuzzyMatch(query, text) {
    const q = query.toLowerCase().replace(/\s+/g, '');
    const t = (text || '').toLowerCase().replace(/\s+/g, '');
    if (!q) return true;
    let ti = 0;
    for (let i = 0; i < q.length; i++) {
        const idx = t.indexOf(q[i], ti);
        if (idx === -1) return false;
        ti = idx + 1;
    }
    return true;
}

function getRecent() {
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
}

function pushRecent(id) {
    let recent = getRecent().filter(x => x !== id);
    recent.unshift(id);
    recent = recent.slice(0, MAX_RECENT);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); } catch (_) {}
}

export function initCommandPalette(actions) {
    const overlay = document.getElementById('commandPaletteOverlay');
    const input = document.getElementById('commandPaletteInput');
    const listEl = document.getElementById('commandPaletteList');
    if (!overlay || !input || !listEl) return;

    let selectedIndex = 0;
    let filtered = [...COMMANDS];

    function renderList() {
        const query = (input.value || '').trim();
        if (query) {
            const q = query.toLowerCase();
            filtered = COMMANDS.filter(c => fuzzyMatch(q, c.label) || fuzzyMatch(q, c.keywords));
        } else {
            const recent = getRecent();
            filtered = [...COMMANDS];
            filtered.sort((a, b) => {
                const ai = recent.indexOf(a.id);
                const bi = recent.indexOf(b.id);
                if (ai === -1 && bi === -1) return 0;
                if (ai === -1) return 1;
                if (bi === -1) return -1;
                return ai - bi;
            });
        }
        selectedIndex = 0;
        listEl.innerHTML = '';
        filtered.forEach((cmd, i) => {
            const div = document.createElement('div');
            div.className = 'command-palette-item' + (i === 0 ? ' selected' : '');
            div.setAttribute('data-index', String(i));
            div.innerHTML = `<span>${escapeHtml(cmd.label)}</span>${cmd.shortcut ? `<kbd>${escapeHtml(cmd.shortcut)}</kbd>` : ''}`;
            div.addEventListener('click', () => runCommand(cmd));
            listEl.appendChild(div);
        });
    }

    function escapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function runCommand(cmd) {
        pushRecent(cmd.id);
        if (cmd.action === 'addModul' && actions.addModul) actions.addModul();
        if (cmd.action === 'addSubModul' && actions.addSubModul) actions.addSubModul();
        if (cmd.action === 'addPart' && actions.addPart) actions.addPart();
        if (cmd.action === 'saveDraft' && actions.saveDraft) actions.saveDraft();
        if (cmd.action === 'switchTab' && actions.switchTab) actions.switchTab(cmd.payload);
        if (cmd.action === 'setDensity' && actions.setDensity) actions.setDensity(cmd.payload);
        if (cmd.action === 'exportJson' && actions.exportJson) actions.exportJson();
        if (cmd.action === 'importJson' && actions.importJson) actions.importJson();
        close();
    }

    function close() {
        overlay.classList.remove('is-open');
        listEl.innerHTML = '';
        input.value = '';
        input.blur();
    }

    function open() {
        overlay.classList.add('is-open');
        input.value = '';
        renderList();
        requestAnimationFrame(() => input.focus());
    }

    function setSelected(idx) {
        selectedIndex = Math.max(0, Math.min(idx, filtered.length - 1));
        const items = listEl.querySelectorAll('.command-palette-item');
        items.forEach((el, i) => el.classList.toggle('selected', i === selectedIndex));
        items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('input', () => { renderList(); setSelected(0); });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { close(); e.preventDefault(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(Math.min(selectedIndex + 1, filtered.length - 1)); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(Math.max(selectedIndex - 1, 0)); return; }
        if (e.key === 'Enter' && filtered[selectedIndex]) { e.preventDefault(); runCommand(filtered[selectedIndex]); return; }
    });

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); open(); }
    });

    const btn = document.getElementById('btnCommandPalette');
    if (btn) btn.addEventListener('click', open);

    return { open, close };
}
