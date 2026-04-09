'use client';

import { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import type { MasterData } from '@/types';
import { loadMasterData, saveMasterData, getDefaultMasterData, addModul, addSubModul, addMaterial, updateModul, updateSubModul, updateMaterial, deleteModul, deleteSubModul, deleteMaterial, incrementModulUsage, incrementSubModulUsage, incrementMaterialUsage } from '@/lib/masterData';

interface MasterDataContextType {
  masterData: MasterData;
  addModul: (name: string, code?: string, description?: string) => void;
  updateModul: (id: string, updates: any) => void;
  deleteModul: (id: string) => void;
  addSubModul: (modulId: string, name: string, code?: string, description?: string) => void;
  updateSubModul: (id: string, updates: any) => void;
  deleteSubModul: (id: string) => void;
  addMaterial: (name: string, code?: string, jenis?: string, grade?: string, supplier?: string, unitCost?: string, description?: string) => void;
  updateMaterial: (id: string, updates: any) => void;
  deleteMaterial: (id: string) => void;
  saveMasterData: () => boolean;
  incrementModulUsage: (modulId: string) => void;
  incrementSubModulUsage: (submodulId: string) => void;
  incrementMaterialUsage: (materialId: string) => void;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export function MasterDataProvider({ children }: { children: ReactNode }) {
  const [masterData, setMasterData] = useState<MasterData>(() => {
    try {
      return loadMasterData();
    } catch {
      return getDefaultMasterData();
    }
  });

  const handleAddModul = useCallback((name: string, code?: string, description?: string) => {
    setMasterData((prev) => addModul(prev, name, code, description));
  }, []);

  const handleUpdateModul = useCallback((id: string, updates: any) => {
    setMasterData((prev) => updateModul(prev, id, updates));
  }, []);

  const handleDeleteModul = useCallback((id: string) => {
    setMasterData((prev) => deleteModul(prev, id));
  }, []);

  const handleAddSubModul = useCallback((modulId: string, name: string, code?: string, description?: string) => {
    setMasterData((prev) => addSubModul(prev, modulId, name, code, description));
  }, []);

  const handleUpdateSubModul = useCallback((id: string, updates: any) => {
    setMasterData((prev) => updateSubModul(prev, id, updates));
  }, []);

  const handleDeleteSubModul = useCallback((id: string) => {
    setMasterData((prev) => deleteSubModul(prev, id));
  }, []);

  const handleAddMaterial = useCallback((name: string, code?: string, jenis?: string, grade?: string, supplier?: string, unitCost?: string, description?: string) => {
    setMasterData((prev) => addMaterial(prev, name, code, jenis, grade, supplier, unitCost, description));
  }, []);

  const handleUpdateMaterial = useCallback((id: string, updates: any) => {
    setMasterData((prev) => updateMaterial(prev, id, updates));
  }, []);

  const handleDeleteMaterial = useCallback((id: string) => {
    setMasterData((prev) => deleteMaterial(prev, id));
  }, []);

  const handleSaveMasterData = useCallback((): boolean => {
    return saveMasterData(masterData);
  }, [masterData]);

  const handleIncrementModulUsage = useCallback((modulId: string) => {
    setMasterData((prev) => incrementModulUsage(prev, modulId));
  }, []);

  const handleIncrementSubModulUsage = useCallback((submodulId: string) => {
    setMasterData((prev) => incrementSubModulUsage(prev, submodulId));
  }, []);

  const handleIncrementMaterialUsage = useCallback((materialId: string) => {
    setMasterData((prev) => incrementMaterialUsage(prev, materialId));
  }, []);

  const value: MasterDataContextType = {
    masterData,
    addModul: handleAddModul,
    updateModul: handleUpdateModul,
    deleteModul: handleDeleteModul,
    addSubModul: handleAddSubModul,
    updateSubModul: handleUpdateSubModul,
    deleteSubModul: handleDeleteSubModul,
    addMaterial: handleAddMaterial,
    updateMaterial: handleUpdateMaterial,
    deleteMaterial: handleDeleteMaterial,
    saveMasterData: handleSaveMasterData,
    incrementModulUsage: handleIncrementModulUsage,
    incrementSubModulUsage: handleIncrementSubModulUsage,
    incrementMaterialUsage: handleIncrementMaterialUsage,
  };

  return <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>;
}

export function useMasterData(): MasterDataContextType {
  const context = useContext(MasterDataContext);
  if (!context) {
    throw new Error('useMasterData must be used within MasterDataProvider');
  }
  return context;
}
