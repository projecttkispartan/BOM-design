import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { recomputeRow } from '../utils/calculations';
import {
  defaultMetadata,
  defaultBomRows,
  defaultHardwareRows,
  STORAGE_KEY,
  DENSITY_KEY,
  generateRowId,
  generateHardwareId,
  generateRoutingStepId,
  normalizeBomRow,
  createMejaTemplate,
} from '../utils/initialState';

const initialState = {
  metadata: { ...defaultMetadata },
  bomRows: defaultBomRows.map((r) => ({ ...r })),
  hardwareRows: defaultHardwareRows.map((r) => ({ ...r })),
  density: typeof window !== 'undefined' ? (localStorage.getItem(DENSITY_KEY) || 'compact') : 'compact',
};

function isDescendantOf(rows, rowId, ancestorId) {
  const byId = new Map(rows.map((r) => [r.id, r]));
  let r = byId.get(rowId);
  while (r?.parentId) {
    if (r.parentId === ancestorId) return true;
    r = byId.get(r.parentId);
  }
  return false;
}

function getInsertAfterIndex(rows, parent) {
  const idx = rows.findIndex((r) => r.id === parent.id);
  if (idx < 0) return rows.length - 1;
  let last = idx;
  for (let i = idx + 1; i < rows.length; i++) {
    if (!isDescendantOf(rows, rows[i].id, parent.id)) return last;
    last = i;
  }
  return last;
}

function renumber(rows) {
  return rows.map((r, i) => ({ ...r, no: i + 1 }));
}

function blankRow(overrides = {}) {
  return normalizeBomRow({
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
    unit: 'EA',
    material: '',
    kodeMat: '',
    sisiVen: '', sisiEdg: '', grVen: '', laminasi: '', glueArea: '', finNo: '', finishing: '', jnsKomp: '', wbs: '',
    workCenterOrRouting: '',
    ketProses: '',
    routingSteps: [],
    dimAP: '', dimAL: '', dimAT: '', dimBP: '', dimBL: '', dimBT: '', dimCP: '', dimCL: '', dimCT: '', dimDP: '', dimDL: '', dimDT: '',
    prodKode: '', prodP: '', prodL: '', prodT: '',
    qtyPart: '', qty: '', mLari: '', m2: '', volCut: '', volInv: '', procCode: '',
    ...overrides,
  });
}

function bomReducer(state, action) {
  switch (action.type) {
    case 'LOAD': {
      const payload = action.payload ?? initialState;
      const defaultMeta = initialState.metadata;
      const loadedMeta = payload.metadata ?? state.metadata;
      const metadata = { ...defaultMeta, ...loadedMeta };
      return {
        ...state,
        metadata,
        bomRows: (payload.bomRows ?? state.bomRows).map(normalizeBomRow),
        hardwareRows: payload.hardwareRows ?? state.hardwareRows,
      };
    }
    case 'SET_METADATA':
      return { ...state, metadata: { ...state.metadata, ...action.payload } };
    case 'SET_BOM_ROWS': {
      const rows = action.payload.map(normalizeBomRow);
      return { ...state, bomRows: rows };
    }
    case 'UPDATE_BOM_ROW': {
      const { id, updates } = action.payload;
      const rows = state.bomRows.map((r) =>
        r.id === id ? recomputeRow(normalizeBomRow({ ...r, ...updates })) : r
      );
      return { ...state, bomRows: rows };
    }
    case 'DELETE_BOM_ROW': {
      const id = action.payload;
      const rows = state.bomRows.filter((r) => r.id !== id);
      return { ...state, bomRows: renumber(rows) };
    }
    case 'SET_HARDWARE_ROWS':
      return { ...state, hardwareRows: action.payload };
    case 'UPDATE_HARDWARE_ROW': {
      const { id, updates } = action.payload;
      const rows = state.hardwareRows.map((r) => (r.id === id ? { ...r, ...updates } : r));
      return { ...state, hardwareRows: rows };
    }
    case 'ADD_HARDWARE_ROW': {
      const rows = state.hardwareRows;
      const newRow = {
        id: action.payload?.newId || generateHardwareId(),
        no: rows.length + 1,
        partCode: '',
        description: '',
        material: 'HARDWARE',
        jenisHardware: 'FITTING',
        qty: '1',
        keterangan: '',
      };
      return { ...state, hardwareRows: [...rows, newRow] };
    }
    case 'REMOVE_HARDWARE_ROW': {
      const id = action.payload;
      const rows = state.hardwareRows.filter((r) => r.id !== id).map((r, i) => ({ ...r, no: i + 1 }));
      return { ...state, hardwareRows: rows };
    }
    case 'ADD_MODUL': {
      const rows = state.bomRows.map(normalizeBomRow);
      const newRow = blankRow({
        level: 'module',
        levelNum: 0,
        parentId: null,
        mod: String(rows.length + 1),
        modul: '',
        description: '',
        unit: 'EA',
      });
      return { ...state, bomRows: renumber([...rows, newRow]) };
    }
    case 'ADD_SUBMODUL': {
      const rows = state.bomRows.map(normalizeBomRow);
      const parent = [...rows].reverse().find((r) => r.levelNum === 0);
      if (!parent) return state;
      const insertAfter = getInsertAfterIndex(rows, parent);
      const siblings = rows.filter((r) => r.parentId === parent.id && (r.levelNum ?? 2) === 1);
      const nextNum = siblings.length + 1;
      const newRow = blankRow({
        level: 'submodule',
        levelNum: 1,
        parentId: parent.id,
        mod: `${parent.mod}.${nextNum}`,
        subMod: `${parent.mod}.${nextNum}`,
        modul: parent.modul || '',
        description: '',
        unit: 'SET',
      });
      const inserted = [...rows.slice(0, insertAfter + 1), newRow, ...rows.slice(insertAfter + 1)];
      return { ...state, bomRows: renumber(inserted) };
    }
    case 'ADD_PART': {
      const rows = state.bomRows.map(normalizeBomRow);
      const parent = [...rows].reverse().find((r) => r.levelNum === 1 || r.levelNum === 0);
      if (!parent) return state;
      const insertAfter = getInsertAfterIndex(rows, parent);
      const siblings = rows.filter((r) => r.parentId === parent.id && (r.levelNum ?? 2) === 2);
      const nextNum = siblings.length + 1;
      const modCode = parent.mod ? `${parent.mod}.${nextNum}` : String(nextNum);
      const newRow = blankRow({
        ...(action.payload?.newId && { id: action.payload.newId }),
        level: 'part',
        levelNum: 2,
        parentId: parent.id,
        mod: modCode,
        subMod: modCode,
        modul: parent.modul || '',
        description: '',
        unit: 'EA',
      });
      const inserted = [...rows.slice(0, insertAfter + 1), newRow, ...rows.slice(insertAfter + 1)];
      return { ...state, bomRows: renumber(inserted) };
    }
    case 'ADD_MEJA_TEMPLATE': {
      const templateRows = (action.payload || []).map(normalizeBomRow);
      if (!templateRows.length) return state;
      const merged = [...state.bomRows, ...templateRows];
      return { ...state, bomRows: renumber(merged) };
    }
    case 'SET_DENSITY':
      return { ...state, density: action.payload };
    default:
      return state;
  }
}

const BomContext = createContext(null);

export function BomProvider({ children }) {
  const [state, dispatch] = useReducer(bomReducer, initialState);
  const lastAddedPartIdRef = React.useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        dispatch({ type: 'LOAD', payload: parsed });
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (state.density && typeof localStorage !== 'undefined') {
      localStorage.setItem(DENSITY_KEY, state.density);
    }
  }, [state.density]);

  const setMetadata = useCallback((meta) => dispatch({ type: 'SET_METADATA', payload: meta }), []);
  const setBomRows = useCallback((rows) => dispatch({ type: 'SET_BOM_ROWS', payload: rows }), []);
  const updateBomRow = useCallback((id, updates) => dispatch({ type: 'UPDATE_BOM_ROW', payload: { id, updates } }), []);
  const removeBomRow = useCallback((id) => dispatch({ type: 'DELETE_BOM_ROW', payload: id }), []);
  const setHardwareRows = useCallback((rows) => dispatch({ type: 'SET_HARDWARE_ROWS', payload: rows }), []);
  const updateHardwareRow = useCallback((id, updates) => dispatch({ type: 'UPDATE_HARDWARE_ROW', payload: { id, updates } }), []);
  const addHardwareRow = useCallback(() => {
    const newId = generateHardwareId();
    dispatch({ type: 'ADD_HARDWARE_ROW', payload: { newId } });
    return newId;
  }, []);
  const removeHardwareRow = useCallback((id) => dispatch({ type: 'REMOVE_HARDWARE_ROW', payload: id }), []);
  const addModul = useCallback(() => dispatch({ type: 'ADD_MODUL' }), []);
  const addSubModul = useCallback(() => dispatch({ type: 'ADD_SUBMODUL' }), []);
  const addPart = useCallback(() => {
    const newId = generateRowId();
    lastAddedPartIdRef.current = newId;
    dispatch({ type: 'ADD_PART', payload: { newId } });
  }, []);
  const addMejaTemplate = useCallback(() => {
    dispatch({ type: 'ADD_MEJA_TEMPLATE', payload: createMejaTemplate() });
  }, []);
  const getLastAddedPartId = useCallback(() => {
    const id = lastAddedPartIdRef.current;
    lastAddedPartIdRef.current = null;
    return id;
  }, []);
  const setDensity = useCallback((d) => dispatch({ type: 'SET_DENSITY', payload: d }), []);

  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          metadata: state.metadata,
          bomRows: state.bomRows,
          hardwareRows: state.hardwareRows,
        })
      );
      return true;
    } catch (_) {
      return false;
    }
  }, [state.metadata, state.bomRows, state.hardwareRows]);

  const loadFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        dispatch({ type: 'LOAD', payload: JSON.parse(raw) });
        return true;
      }
    } catch (_) {}
    return false;
  }, []);

  const getUniqueModulNames = useCallback(() => {
    const set = new Set();
    state.bomRows.forEach((r) => {
      if (r.modul?.trim()) set.add(r.modul.trim());
    });
    return Array.from(set).sort();
  }, [state.bomRows]);

  const value = {
    ...state,
    setMetadata,
    setBomRows,
    updateBomRow,
    removeBomRow,
    setHardwareRows,
    updateHardwareRow,
    addHardwareRow,
    removeHardwareRow,
    addModul,
    addSubModul,
    addPart,
    addMejaTemplate,
    getLastAddedPartId,
    setDensity,
    saveToStorage,
    loadFromStorage,
    getUniqueModulNames,
  };

  return <BomContext.Provider value={value}>{children}</BomContext.Provider>;
}

export function useBom() {
  const ctx = useContext(BomContext);
  if (!ctx) throw new Error('useBom must be used within BomProvider');
  return ctx;
}
