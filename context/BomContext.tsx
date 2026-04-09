'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { BomRow, BomMetadata, HardwareRow, Operation, PackingRow, PackingInfo } from '@/types';
import { recomputeRow, recalculateAllRows } from '@/lib/calculations';
import {
  defaultMetadata,
  defaultBomRows,
  defaultHardwareRows,
  defaultOperations,
  defaultPackingInfo,
  STORAGE_KEY,
  DENSITY_KEY,
  generateRowId,
  generateHardwareId,
  createMejaTemplate,
} from '@/lib/initialState';
import { normalizeBomRow } from '@/lib/normalizeBomRow';

interface BomState {
  metadata: BomMetadata;
  bomRows: BomRow[];
  hardwareRows: HardwareRow[];
  operations: Operation[];
  packingRows: PackingRow[];
  packingInfo: PackingInfo;
  density: string;
}

const initialState: BomState = {
  metadata: { ...defaultMetadata },
  bomRows: defaultBomRows.map((r) => ({ ...r })),
  hardwareRows: defaultHardwareRows.map((r) => ({ ...r })),
  operations: defaultOperations.map((r) => ({ ...r })),
  packingRows: [],
  packingInfo: { ...defaultPackingInfo },
  density: typeof window !== 'undefined' ? (localStorage.getItem(DENSITY_KEY) || 'compact') : 'compact',
};

function isDescendantOf(rows: BomRow[], rowId: string, ancestorId: string): boolean {
  const byId = new Map(rows.map((r) => [r.id, r]));
  let r = byId.get(rowId);
  while (r?.parentId) {
    if (r.parentId === ancestorId) return true;
    r = byId.get(r.parentId);
  }
  return false;
}

function getInsertAfterIndex(rows: BomRow[], parent: BomRow): number {
  const idx = rows.findIndex((r) => r.id === parent.id);
  if (idx < 0) return rows.length - 1;
  let last = idx;
  for (let i = idx + 1; i < rows.length; i++) {
    if (!isDescendantOf(rows, rows[i].id, parent.id)) return last;
    last = i;
  }
  return last;
}

function renumber(rows: BomRow[]): BomRow[] {
  return rows.map((r, i) => ({ ...r, no: i + 1 }));
}

function blankRow(overrides: Partial<BomRow> = {}): BomRow {
  return recomputeRow(
    normalizeBomRow({
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
      workCenterOrRouting: '',
      assembling: '',
      keterangan: '',
      routingSteps: [],
      surface: '',
      surfaceCost: '',
      treatmentCost: '',
      dimAP: '',
      dimAL: '',
      dimAT: '',
      volCut: '',
      qty: '',
      ...overrides,
    } as BomRow),
  );
}

type BomAction =
  | { type: 'LOAD'; payload: Partial<BomState> }
  | { type: 'SET_METADATA'; payload: Partial<BomMetadata> }
  | { type: 'SET_BOM_ROWS'; payload: BomRow[] }
  | { type: 'UPDATE_BOM_ROW'; payload: { id: string; updates: Partial<BomRow> } }
  | { type: 'DELETE_BOM_ROW'; payload: string }
  | { type: 'SET_HARDWARE_ROWS'; payload: HardwareRow[] }
  | { type: 'UPDATE_HARDWARE_ROW'; payload: { id: string; updates: Partial<HardwareRow> } }
  | { type: 'ADD_HARDWARE_ROW'; payload?: { newId?: string } }
  | { type: 'REMOVE_HARDWARE_ROW'; payload: string }
  | { type: 'ADD_MODUL' }
  | { type: 'ADD_SUBMODUL' }
  | { type: 'ADD_PART'; payload?: { newId?: string; initialData?: Partial<BomRow> } }
  | { type: 'ADD_CHILD_UNDER'; payload: { parentId: string; newId?: string } }
  | { type: 'ADD_ROW_ABOVE'; payload: { targetRowId: string; newId?: string } }
  | { type: 'ADD_MEJA_TEMPLATE'; payload: BomRow[] }
  | { type: 'SET_OPERATIONS'; payload: Operation[] }
  | { type: 'SET_PACKING_ROWS'; payload: PackingRow[] }
  | { type: 'SET_PACKING_INFO'; payload: Partial<PackingInfo> }
  | { type: 'RECALCULATE_ALL' }
  | { type: 'SET_DENSITY'; payload: string };

function bomReducer(state: BomState, action: BomAction): BomState {
  switch (action.type) {
    case 'LOAD': {
      const payload = action.payload ?? initialState;
      const metadata = { ...defaultMetadata, ...(payload.metadata ?? state.metadata) };
      return {
        ...state,
        metadata,
        bomRows: (payload.bomRows ?? state.bomRows).map((r) => recomputeRow(normalizeBomRow(r))),
        hardwareRows: payload.hardwareRows ?? state.hardwareRows,
        operations: payload.operations ?? state.operations,
        packingRows: payload.packingRows ?? state.packingRows,
        packingInfo: payload.packingInfo ? { ...defaultPackingInfo, ...payload.packingInfo } : state.packingInfo,
      };
    }
    case 'SET_METADATA':
      return { ...state, metadata: { ...state.metadata, ...action.payload } };
    case 'SET_BOM_ROWS':
      return { ...state, bomRows: action.payload };
    case 'UPDATE_BOM_ROW': {
      const { id, updates } = action.payload;
      const rows = state.bomRows.map((r) =>
        r.id === id ? recomputeRow(normalizeBomRow({ ...r, ...updates } as BomRow)) : r,
      );
      return { ...state, bomRows: rows };
    }
    case 'DELETE_BOM_ROW': {
      const rows = state.bomRows.filter((r) => r.id !== action.payload);
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
      const newRow: HardwareRow = {
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
      const rows = state.hardwareRows.filter((r) => r.id !== action.payload).map((r, i) => ({ ...r, no: i + 1 }));
      return { ...state, hardwareRows: rows };
    }
    case 'ADD_MODUL': {
      const rows = state.bomRows.map(normalizeBomRow);
      const newRow = blankRow({ level: 'module', levelNum: 0, parentId: null, mod: String(rows.length + 1), modul: '', description: '', unit: 'EA' });
      return { ...state, bomRows: renumber([...rows, newRow]) };
    }
    case 'ADD_SUBMODUL': {
      const rows = state.bomRows.map(normalizeBomRow);
      const parent = [...rows].reverse().find((r) => r.levelNum === 0);
      if (!parent) return state;
      const insertAfter = getInsertAfterIndex(rows, parent);
      const siblings = rows.filter((r) => r.parentId === parent.id && (r.levelNum ?? 2) === 1);
      const nextNum = siblings.length + 1;
      const newRow = blankRow({ level: 'submodule', levelNum: 1, parentId: parent.id, mod: `${parent.mod}.${nextNum}`, subMod: `${parent.mod}.${nextNum}`, modul: parent.modul || '', description: '', unit: 'SET' });
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
        ...action.payload?.initialData,
        level: 'part',
        levelNum: 2,
        parentId: parent.id,
        mod: modCode,
        subMod: modCode,
        modul: parent.modul || '',
        description: action.payload?.initialData?.description || '',
        unit: 'EA',
      });
      const inserted = [...rows.slice(0, insertAfter + 1), newRow, ...rows.slice(insertAfter + 1)];
      return { ...state, bomRows: renumber(inserted) };
    }
    case 'ADD_CHILD_UNDER': {
      const rows = state.bomRows.map(normalizeBomRow);
      const parent = rows.find((r) => r.id === action.payload.parentId);
      if (!parent) return state;
      const insertAfter = getInsertAfterIndex(rows, parent);
      const childLevel: 'submodule' | 'part' | 'operation' = parent.levelNum === 0 ? 'submodule' : parent.levelNum === 1 ? 'part' : 'operation';
      const childLevelNum = parent.levelNum === 0 ? 1 : parent.levelNum === 1 ? 2 : 3;
      const siblings = rows.filter((r) => r.parentId === parent.id && r.levelNum === childLevelNum);
      const nextNum = siblings.length + 1;
      const modCode = parent.mod ? `${parent.mod}.${nextNum}` : String(nextNum);
      const newRow = blankRow({
        ...(action.payload.newId && { id: action.payload.newId }),
        level: childLevel,
        levelNum: childLevelNum,
        parentId: parent.id,
        mod: modCode,
        subMod: childLevel === 'submodule' ? modCode : childLevel === 'part' ? modCode : '',
        modul: parent.modul || parent.description || '',
        description: '',
        unit: childLevel === 'submodule' ? 'SET' : 'EA',
      });
      const inserted = [...rows.slice(0, insertAfter + 1), newRow, ...rows.slice(insertAfter + 1)];
      return { ...state, bomRows: renumber(inserted) };
    }
    case 'ADD_ROW_ABOVE': {
      const rows = state.bomRows.map(normalizeBomRow);
      const targetRow = rows.find((r) => r.id === action.payload.targetRowId);
      if (!targetRow) return state;
      const targetIndex = rows.findIndex((r) => r.id === action.payload.targetRowId);
      // Create a new row at the same level as target row
      const newRow = blankRow({
        ...(action.payload.newId && { id: action.payload.newId }),
        level: targetRow.level,
        levelNum: targetRow.levelNum,
        parentId: targetRow.parentId,
        mod: targetRow.mod,
        subMod: targetRow.subMod,
        modul: targetRow.modul,
        description: '',
        unit: targetRow.unit,
      });
      const inserted = [...rows.slice(0, targetIndex), newRow, ...rows.slice(targetIndex)];
      return { ...state, bomRows: renumber(inserted) };
    }
    case 'ADD_MEJA_TEMPLATE': {
      const templateRows = action.payload.map((r) => recomputeRow(normalizeBomRow(r)));
      if (!templateRows.length) return state;
      return { ...state, bomRows: renumber([...state.bomRows, ...templateRows]) };
    }
    case 'SET_OPERATIONS':
      return { ...state, operations: action.payload };
    case 'SET_PACKING_ROWS':
      return { ...state, packingRows: action.payload };
    case 'SET_PACKING_INFO':
      return { ...state, packingInfo: { ...state.packingInfo, ...action.payload } };
    case 'RECALCULATE_ALL':
      return { ...state, bomRows: recalculateAllRows(state.bomRows) };
    case 'SET_DENSITY':
      return { ...state, density: action.payload };
    default:
      return state;
  }
}

interface BomContextValue extends BomState {
  setMetadata: (meta: Partial<BomMetadata>) => void;
  setBomRows: (rows: BomRow[]) => void;
  updateBomRow: (id: string, updates: Partial<BomRow>) => void;
  removeBomRow: (id: string) => void;
  setHardwareRows: (rows: HardwareRow[]) => void;
  updateHardwareRow: (id: string, updates: Partial<HardwareRow>) => void;
  addHardwareRow: () => string;
  removeHardwareRow: (id: string) => void;
  addModul: () => void;
  addSubModul: () => void;
  addPart: (initialData?: Partial<BomRow>) => string;
  addChildUnder: (parentId: string) => string;
  addRowAbove: (targetRowId: string) => string;
  addOperation: () => string;
  addMejaTemplate: () => void;
  getLastAddedPartId: () => string | null;
  setOperations: (ops: Operation[]) => void;
  setPackingRows: (rows: PackingRow[]) => void;
  setPackingInfo: (info: Partial<PackingInfo>) => void;
  recalculateAll: () => void;
  setDensity: (d: string) => void;
  saveToStorage: () => boolean;
  loadFromStorage: () => boolean;
  getUniqueModulNames: () => string[];
  validatePackingComplete: () => { valid: boolean; errors: string[] };
}

const BomContext = createContext<BomContextValue | null>(null);

export function BomProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(bomReducer, initialState);
  const lastAddedPartIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    // Frontend-only mode: localStorage is used as the primary persistence.
  }, []);

  useEffect(() => {
    if (state.density && typeof window !== 'undefined') {
      localStorage.setItem(DENSITY_KEY, state.density);
    }
  }, [state.density]);

  const setMetadata = useCallback((meta: Partial<BomMetadata>) => dispatch({ type: 'SET_METADATA', payload: meta }), []);
  const setBomRows = useCallback((rows: BomRow[]) => dispatch({ type: 'SET_BOM_ROWS', payload: rows }), []);
  const updateBomRow = useCallback((id: string, updates: Partial<BomRow>) => dispatch({ type: 'UPDATE_BOM_ROW', payload: { id, updates } }), []);
  const removeBomRow = useCallback((id: string) => dispatch({ type: 'DELETE_BOM_ROW', payload: id }), []);
  const setHardwareRows = useCallback((rows: HardwareRow[]) => dispatch({ type: 'SET_HARDWARE_ROWS', payload: rows }), []);
  const updateHardwareRow = useCallback((id: string, updates: Partial<HardwareRow>) => dispatch({ type: 'UPDATE_HARDWARE_ROW', payload: { id, updates } }), []);
  const addHardwareRow = useCallback(() => {
    const newId = generateHardwareId();
    dispatch({ type: 'ADD_HARDWARE_ROW', payload: { newId } });
    return newId;
  }, []);
  const removeHardwareRow = useCallback((id: string) => dispatch({ type: 'REMOVE_HARDWARE_ROW', payload: id }), []);
  const addModul = useCallback(() => dispatch({ type: 'ADD_MODUL' }), []);
  const addSubModul = useCallback(() => dispatch({ type: 'ADD_SUBMODUL' }), []);
  const addPart = useCallback((initialData?: Partial<BomRow>) => {
    const newId = generateRowId();
    lastAddedPartIdRef.current = newId;
    dispatch({ type: 'ADD_PART', payload: { newId, initialData } });
    return newId;
  }, []);
  const addChildUnder = useCallback((parentId: string) => {
    const newId = generateRowId();
    dispatch({ type: 'ADD_CHILD_UNDER', payload: { parentId, newId } });
    lastAddedPartIdRef.current = newId;
    return newId;
  }, []);
  const addRowAbove = useCallback((targetRowId: string) => {
    const newId = generateRowId();
    dispatch({ type: 'ADD_ROW_ABOVE', payload: { targetRowId, newId } });
    lastAddedPartIdRef.current = newId;
    return newId;
  }, []);
  const addOperation = useCallback(() => {
    const rows = state.bomRows;
    const lastRow = [...rows].reverse().find((r) => r.levelNum <= 2);
    if (!lastRow) return '';
    return addChildUnder(lastRow.id);
  }, [state.bomRows, addChildUnder]);
  const addMejaTemplate = useCallback(() => dispatch({ type: 'ADD_MEJA_TEMPLATE', payload: createMejaTemplate() }), []);
  const getLastAddedPartId = useCallback(() => {
    const id = lastAddedPartIdRef.current;
    lastAddedPartIdRef.current = null;
    return id;
  }, []);
  const setOperations = useCallback((ops: Operation[]) => dispatch({ type: 'SET_OPERATIONS', payload: ops }), []);
  const setPackingRows = useCallback((rows: PackingRow[]) => dispatch({ type: 'SET_PACKING_ROWS', payload: rows }), []);
  const setPackingInfo = useCallback((info: Partial<PackingInfo>) => dispatch({ type: 'SET_PACKING_INFO', payload: info }), []);
  const recalculateAll = useCallback(() => dispatch({ type: 'RECALCULATE_ALL' }), []);
  const setDensity = useCallback((d: string) => dispatch({ type: 'SET_DENSITY', payload: d }), []);

  const saveToStorage = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            metadata: state.metadata,
            bomRows: state.bomRows,
            hardwareRows: state.hardwareRows,
            operations: state.operations,
            packingRows: state.packingRows,
            packingInfo: state.packingInfo,
          }),
        );
        return true;
      }
    } catch (_) {}
    return false;
  }, [state.metadata, state.bomRows, state.hardwareRows, state.operations, state.packingRows, state.packingInfo]);

  const loadFromStorage = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          dispatch({ type: 'LOAD', payload: JSON.parse(raw) });
          return true;
        }
      }
    } catch (_) {}
    return false;
  }, []);

  const getUniqueModulNames = useCallback(() => {
    const set = new Set<string>();
    state.bomRows.forEach((r) => {
      if (r.modul?.trim()) set.add(r.modul.trim());
    });
    return Array.from(set).sort();
  }, [state.bomRows]);

  const validatePackingComplete = useCallback(() => {
    const errors: string[] = [];
    
    // Check if packing rows exist and have data
    const hasPackingData = state.packingRows && state.packingRows.length > 0;
    if (!hasPackingData && state.metadata?.bomType === 'Kit') {
      errors.push('Data Packing wajib diisi untuk BOM tipe Kit sebelum dapat di-finalize');
    }
    
    // Check if packing info has required data (especially for export/kit)
    const packingInfo = state.packingInfo;
    if (state.metadata?.bomType === 'Kit') {
      if (!packingInfo?.outerBoxP || parseFloat(packingInfo.outerBoxP || '0') <= 0) {
        errors.push('Dimensi outer box panjang wajib diisi');
      }
      if (!packingInfo?.outerBoxL || parseFloat(packingInfo.outerBoxL || '0') <= 0) {
        errors.push('Dimensi outer box lebar wajib diisi');
      }
      if (!packingInfo?.outerBoxT || parseFloat(packingInfo.outerBoxT || '0') <= 0) {
        errors.push('Dimensi outer box tinggi wajib diisi');
      }
      if (!packingInfo?.netWeight || parseFloat(packingInfo.netWeight || '0') <= 0) {
        errors.push('Net Weight wajib diisi');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }, [state.packingRows, state.packingInfo, state.metadata?.bomType]);

  const value: BomContextValue = {
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
    addChildUnder,
    addRowAbove,
    addOperation,
    addMejaTemplate,
    getLastAddedPartId,
    setOperations,
    setPackingRows,
    setPackingInfo,
    recalculateAll,
    setDensity,
    saveToStorage,
    loadFromStorage,
    getUniqueModulNames,
    validatePackingComplete,
  };

  return <BomContext.Provider value={value}>{children}</BomContext.Provider>;
}

export function useBom(): BomContextValue {
  const ctx = useContext(BomContext);
  if (!ctx) throw new Error('useBom must be used within BomProvider');
  return ctx;
}
