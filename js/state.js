/**
 * BOM state: metadata, bomRows, hardwareRows.
 * Single source of truth for the app.
 */

const STORAGE_KEY = 'bom-app-state';
const DENSITY_KEY = 'bom-app-density';

export const defaultMetadata = {
    customer: 'AMATA',
    itemType: 'TABLE / MEJA MAKAN',
    wood: 'JATI',
    coatingColor: 'NATURAL JATI',
    itemDim: '1800 x 900 x 750',
    volM3: '0.285',
};

/** Sampel BOM: Meja Makan — Level 0 = Modul, 1 = Sub Modul, 2 = Part */
export const defaultBomRows = [
    {
        id: 'r1',
        level: 'module',
        levelNum: 0,
        parentId: null,
        expanded: true,
        no: 1,
        mod: '1',
        subMod: '',
        partCode: '',
        modul: 'MEJA MAKAN',
        description: 'MEJA MAKAN',
        material: '',
        kodeMat: '',
        sisiVen: '', sisiEdg: '', grVen: '', laminasi: '', glueArea: '', finNo: '', finishing: '', jnsKomp: '', wbs: '',
        workCenterOrRouting: '',
        ketProses: '',
        dimAP: '', dimAL: '', dimAT: '', dimBP: '', dimBL: '', dimBT: '', dimCP: '', dimCL: '', dimCT: '', dimDP: '', dimDL: '', dimDT: '',
        prodKode: '', prodP: '', prodL: '', prodT: '',
        qtyPart: '', qty: '', mLari: '', m2: '', volCut: '', volInv: '', procCode: '',
    },
    {
        id: 'r2',
        level: 'submodule',
        levelNum: 1,
        parentId: 'r1',
        expanded: true,
        no: 2,
        mod: '1.1',
        subMod: '1.1',
        partCode: '',
        modul: 'MEJA MAKAN',
        description: 'KAKI MEJA',
        material: '',
        kodeMat: '',
        sisiVen: '', sisiEdg: '', grVen: '', laminasi: '', glueArea: '', finNo: '', finishing: '', jnsKomp: '', wbs: '',
        workCenterOrRouting: 'W1.1 PENGERJAAN KAYU',
        ketProses: 'POTONG - ROUTER - FINISHING',
        dimAP: '', dimAL: '', dimAT: '', dimBP: '', dimBL: '', dimBT: '', dimCP: '', dimCL: '', dimCT: '', dimDP: '', dimDL: '', dimDT: '',
        prodKode: '', prodP: '', prodL: '', prodT: '',
        qtyPart: '', qty: '', mLari: '', m2: '', volCut: '', volInv: '', procCode: '',
    },
    {
        id: 'r3',
        level: 'part',
        levelNum: 2,
        parentId: 'r2',
        expanded: true,
        no: 3,
        mod: '1.1.1',
        subMod: '1.1.1',
        partCode: 'MM-01-001',
        modul: 'MEJA MAKAN',
        description: 'Kaki Meja',
        material: 'KAYU',
        kodeMat: 'JAT',
        sisiVen: '2', sisiEdg: '4', grVen: 'A', laminasi: '', glueArea: 'J', finNo: '1', finishing: 'NC', jnsKomp: 'LURUS', wbs: 'W1.1',
        workCenterOrRouting: 'W1.1 PEMOTONGAN',
        ketProses: 'POTONG - BUBUT - AMPLAS',
        dimAP: '750', dimAL: '60', dimAT: '60', dimBP: '752', dimBL: '58', dimBT: '58', dimCP: '750', dimCL: '58', dimCT: '58', dimDP: '748', dimDL: '56', dimDT: '56',
        prodKode: 'K', prodP: '752', prodL: '58', prodT: '58',
        qtyPart: '1', qty: '4', mLari: '3.00', m2: '', volCut: '0.0108', volInv: '0.0094', procCode: 'PK-01',
    },
    {
        id: 'r5',
        level: 'submodule',
        levelNum: 1,
        parentId: 'r1',
        expanded: true,
        no: 4,
        mod: '1.2',
        subMod: '1.2',
        partCode: '',
        modul: 'MEJA MAKAN',
        description: 'TOP MEJA',
        material: '',
        kodeMat: '',
        sisiVen: '', sisiEdg: '', grVen: '', laminasi: '', glueArea: '', finNo: '', finishing: '', jnsKomp: '', wbs: '',
        workCenterOrRouting: 'W2.1 PENGERJAAN TOP',
        ketProses: 'GLUE UP - PLANER - FINISHING',
        dimAP: '', dimAL: '', dimAT: '', dimBP: '', dimBL: '', dimBT: '', dimCP: '', dimCL: '', dimCT: '', dimDP: '', dimDL: '', dimDT: '',
        prodKode: '', prodP: '', prodL: '', prodT: '',
        qtyPart: '', qty: '', mLari: '', m2: '', volCut: '', volInv: '', procCode: '',
    },
    {
        id: 'r6',
        level: 'part',
        levelNum: 2,
        parentId: 'r5',
        expanded: true,
        no: 5,
        mod: '1.2.1',
        subMod: '1.2.1',
        partCode: 'MM-02-001',
        modul: 'MEJA MAKAN',
        description: 'Papan Top Meja',
        material: 'KAYU',
        kodeMat: 'JAT',
        sisiVen: '2', sisiEdg: '4', grVen: 'A', laminasi: '', glueArea: 'J', finNo: '1', finishing: 'NC', jnsKomp: 'PANEL', wbs: 'W2.1',
        workCenterOrRouting: 'W2.1 GLUE UP',
        ketProses: 'GLUE UP - KETAM - AMPLAS',
        dimAP: '1820', dimAL: '920', dimAT: '30', dimBP: '1822', dimBL: '918', dimBT: '28', dimCP: '1820', dimCL: '918', dimCT: '28', dimDP: '1800', dimDL: '900', dimDT: '28',
        prodKode: 'T', prodP: '1822', prodL: '918', prodT: '28',
        qtyPart: '1', qty: '1', mLari: '', m2: '1.64', volCut: '0.0502', volInv: '0.0454', procCode: 'TP-01',
    },
    {
        id: 'r7',
        level: 'part',
        levelNum: 2,
        parentId: 'r5',
        expanded: true,
        no: 6,
        mod: '1.2.2',
        subMod: '1.2.2',
        partCode: 'MM-02-002',
        modul: 'MEJA MAKAN',
        description: 'List Top (Edge Banding)',
        material: 'KAYU',
        kodeMat: 'JAT',
        sisiVen: '', sisiEdg: '2', grVen: '', laminasi: '', glueArea: '', finNo: '1', finishing: 'NC', jnsKomp: 'LURUS', wbs: 'W2.1',
        workCenterOrRouting: 'W2.1 EDGING',
        ketProses: 'POTONG - EDGE BANDING',
        dimAP: '1820', dimAL: '30', dimAT: '30', dimBP: '1822', dimBL: '28', dimBT: '28', dimCP: '1820', dimCL: '28', dimCT: '28', dimDP: '1800', dimDL: '28', dimDT: '28',
        prodKode: 'L', prodP: '1822', prodL: '28', prodT: '28',
        qtyPart: '1', qty: '4', mLari: '7.29', m2: '', volCut: '0.0066', volInv: '0.0057', procCode: 'LB-01',
    },
    {
        id: 'r8',
        level: 'submodule',
        levelNum: 1,
        parentId: 'r1',
        expanded: true,
        no: 7,
        mod: '1.3',
        subMod: '1.3',
        partCode: '',
        modul: 'MEJA MAKAN',
        description: 'RANGKA PENYAMBUNG',
        material: '',
        kodeMat: '',
        sisiVen: '', sisiEdg: '', grVen: '', laminasi: '', glueArea: '', finNo: '', finishing: '', jnsKomp: '', wbs: '',
        workCenterOrRouting: 'W1.2 PERAKITAN',
        ketProses: 'POTONG - BOR - PERAKIT',
        dimAP: '', dimAL: '', dimAT: '', dimBP: '', dimBL: '', dimBT: '', dimCP: '', dimCL: '', dimCT: '', dimDP: '', dimDL: '', dimDT: '',
        prodKode: '', prodP: '', prodL: '', prodT: '',
        qtyPart: '', qty: '', mLari: '', m2: '', volCut: '', volInv: '', procCode: '',
    },
    {
        id: 'r9',
        level: 'part',
        levelNum: 2,
        parentId: 'r8',
        expanded: true,
        no: 8,
        mod: '1.3.1',
        subMod: '1.3.1',
        partCode: 'MM-03-001',
        modul: 'MEJA MAKAN',
        description: 'Rail Memanjang Depan',
        material: 'KAYU',
        kodeMat: 'JAT',
        sisiVen: '2', sisiEdg: '4', grVen: 'A', laminasi: '', glueArea: 'J', finNo: '1', finishing: 'NC', jnsKomp: 'LURUS', wbs: 'W1.2',
        workCenterOrRouting: 'W1.2 PEMOTONGAN',
        ketProses: 'POTONG - BOR - AMPLAS',
        dimAP: '1750', dimAL: '80', dimAT: '40', dimBP: '1752', dimBL: '78', dimBT: '38', dimCP: '1750', dimCL: '78', dimCT: '38', dimDP: '1748', dimDL: '76', dimDT: '36',
        prodKode: 'R', prodP: '1752', prodL: '78', prodT: '38',
        qtyPart: '1', qty: '2', mLari: '3.50', m2: '', volCut: '0.0056', volInv: '0.0048', procCode: 'RL-01',
    },
    {
        id: 'r10',
        level: 'part',
        levelNum: 2,
        parentId: 'r8',
        expanded: true,
        no: 9,
        mod: '1.3.2',
        subMod: '1.3.2',
        partCode: 'MM-03-002',
        modul: 'MEJA MAKAN',
        description: 'Rail Melintang Kiri',
        material: 'KAYU',
        kodeMat: 'JAT',
        sisiVen: '2', sisiEdg: '4', grVen: 'A', laminasi: '', glueArea: 'J', finNo: '1', finishing: 'NC', jnsKomp: 'LURUS', wbs: 'W1.2',
        workCenterOrRouting: 'W1.2 PEMOTONGAN',
        ketProses: 'POTONG - BOR - AMPLAS',
        dimAP: '820', dimAL: '80', dimAT: '40', dimBP: '822', dimBL: '78', dimBT: '38', dimCP: '820', dimCL: '78', dimCT: '38', dimDP: '818', dimDL: '76', dimDT: '36',
        prodKode: 'R', prodP: '822', prodL: '78', prodT: '38',
        qtyPart: '1', qty: '2', mLari: '1.64', m2: '', volCut: '0.0026', volInv: '0.0022', procCode: 'RL-02',
    },
];

export const defaultHardwareRows = [
    { id: 'h1', no: 1, partCode: 'MM-HW-001', description: 'Baut Penyambung Kaki (M8 x 60)', material: 'HARDWARE', jenisHardware: 'BOLT', qty: '8', keterangan: 'Per kaki 2 pcs' },
    { id: 'h2', no: 2, partCode: 'MM-HW-002', description: 'Bracket Sambung Top ke Rangka', material: 'HARDWARE', jenisHardware: 'BRACKET', qty: '4', keterangan: '' },
    { id: 'h3', no: 3, partCode: 'MM-HW-003', description: 'Lem Kayu (Kg)', material: 'HARDWARE', jenisHardware: 'ADHESIVE', qty: '0.5', keterangan: '' },
];

let state = {
    metadata: { ...defaultMetadata },
    bomRows: defaultBomRows.map(r => ({ ...r })),
    hardwareRows: defaultHardwareRows.map(r => ({ ...r })),
};

const listeners = new Set();

export function getState() {
    return state;
}

export function setState(partial) {
    state = { ...state, ...partial };
    listeners.forEach(fn => fn(state));
}

export function getMetadata() {
    return state.metadata;
}

export function setMetadata(meta) {
    state = { ...state, metadata: { ...state.metadata, ...meta } };
    listeners.forEach(fn => fn(state));
}

export function getBomRows() {
    return state.bomRows;
}

export function setBomRows(rows) {
    state = { ...state, bomRows: rows };
    listeners.forEach(fn => fn(state));
}

export function getHardwareRows() {
    return state.hardwareRows;
}

export function setHardwareRows(rows) {
    state = { ...state, hardwareRows: rows };
    listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export function loadStateFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.metadata) state.metadata = parsed.metadata;
            if (Array.isArray(parsed.bomRows)) state.bomRows = parsed.bomRows.map(normalizeBomRow);
            if (Array.isArray(parsed.hardwareRows)) state.hardwareRows = parsed.hardwareRows;
            listeners.forEach(fn => fn(state));
            return true;
        }
    } catch (_) {}
    return false;
}

export function saveStateToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            metadata: state.metadata,
            bomRows: state.bomRows,
            hardwareRows: state.hardwareRows,
        }));
        return true;
    } catch (_) {
        return false;
    }
}

export function getDensity() {
    return localStorage.getItem(DENSITY_KEY) || 'compact';
}

export function setDensity(d) {
    if (['compact', 'standard', 'comfortable'].includes(d)) {
        localStorage.setItem(DENSITY_KEY, d);
        return d;
    }
    return getDensity();
}

export function generateRowId() {
    return 'r' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

export function generateHardwareId() {
    return 'h' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

/** Daftar unik nama modul dari data (untuk combo / create dari data) */
export function getUniqueModulNames() {
    const set = new Set();
    state.bomRows.forEach(r => { if (r.modul && r.modul.trim()) set.add(r.modul.trim()); });
    return Array.from(set).sort();
}

/** Normalisasi level: 'module'|'submodule'|'part' -> 0|1|2 */
export function levelToNum(level) {
    if (level === 'module') return 0;
    if (level === 'submodule') return 1;
    return 2;
}

/** Pastikan row punya levelNum, parentId, expanded (backward compat) */
export function normalizeBomRow(row) {
    const r = { ...row };
    if (r.levelNum == null) r.levelNum = levelToNum(r.level || 'part');
    if (r.parentId === undefined) r.parentId = row.parentId ?? null;
    if (r.expanded === undefined) r.expanded = true;
    if (r.workCenterOrRouting === undefined) r.workCenterOrRouting = row.workCenterOrRouting ?? (row.workCenter ?? row.routing ?? '');
    if (r.ketProses === undefined) r.ketProses = row.ketProses ?? '';
    return r;
}
