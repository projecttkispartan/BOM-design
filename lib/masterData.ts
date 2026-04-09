import type { MasterModul, MasterSubModul, MasterMaterial, MasterData } from '@/types';

const MASTER_DATA_KEY = 'bom-app-master-data';

export function generateMasterId(): string {
  return `master-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function loadMasterData(): MasterData {
  try {
    const raw = localStorage.getItem(MASTER_DATA_KEY);
    if (!raw) return getDefaultMasterData();
    const data = JSON.parse(raw) as MasterData;
    return data;
  } catch {
    return getDefaultMasterData();
  }
}

export function saveMasterData(data: MasterData): boolean {
  try {
    localStorage.setItem(MASTER_DATA_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function getDefaultMasterData(): MasterData {
  return {
    moduls: [],
    submoduls: [],
    materials: [
      {
        id: generateMasterId(),
        name: 'MAHONI',
        code: 'MAH',
        jenis: 'KAYU',
        grade: 'A',
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: generateMasterId(),
        name: 'JATI',
        code: 'JAT',
        jenis: 'KAYU',
        grade: 'A',
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: generateMasterId(),
        name: 'MERBAU',
        code: 'MER',
        jenis: 'KAYU',
        grade: 'A',
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: generateMasterId(),
        name: 'SUNGKAI',
        code: 'SUN',
        jenis: 'KAYU',
        grade: 'A',
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: generateMasterId(),
        name: 'KAYU SOLID',
        code: 'KS',
        jenis: 'KAYU',
        grade: 'A',
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: generateMasterId(),
        name: 'MDF',
        code: 'MDF',
        jenis: 'ENGINEERED',
        grade: 'A',
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: generateMasterId(),
        name: 'PLYWOOD',
        code: 'PLY',
        jenis: 'ENGINEERED',
        grade: 'A',
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: generateMasterId(),
        name: 'PARTICLE BOARD',
        code: 'PB',
        jenis: 'ENGINEERED',
        grade: 'A',
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
    ],
  };
}

// Modul management
export function addModul(
  data: MasterData,
  name: string,
  code?: string,
  description?: string
): MasterData {
  const newModul: MasterModul = {
    id: generateMasterId(),
    name,
    code,
    description,
    createdAt: new Date().toISOString(),
    usageCount: 0,
  };
  return {
    ...data,
    moduls: [...data.moduls, newModul],
  };
}

export function updateModul(
  data: MasterData,
  id: string,
  updates: Partial<MasterModul>
): MasterData {
  return {
    ...data,
    moduls: data.moduls.map((m) => (m.id === id ? { ...m, ...updates } : m)),
  };
}

export function deleteModul(data: MasterData, id: string): MasterData {
  return {
    ...data,
    moduls: data.moduls.filter((m) => m.id !== id),
    submoduls: data.submoduls.filter((s) => s.modulId !== id),
  };
}

// SubModul management
export function addSubModul(
  data: MasterData,
  modulId: string,
  name: string,
  code?: string,
  description?: string
): MasterData {
  const newSubModul: MasterSubModul = {
    id: generateMasterId(),
    modulId,
    name,
    code,
    description,
    createdAt: new Date().toISOString(),
    usageCount: 0,
  };
  return {
    ...data,
    submoduls: [...data.submoduls, newSubModul],
  };
}

export function updateSubModul(
  data: MasterData,
  id: string,
  updates: Partial<MasterSubModul>
): MasterData {
  return {
    ...data,
    submoduls: data.submoduls.map((s) => (s.id === id ? { ...s, ...updates } : s)),
  };
}

export function deleteSubModul(data: MasterData, id: string): MasterData {
  return {
    ...data,
    submoduls: data.submoduls.filter((s) => s.id !== id),
  };
}

// Material management
export function addMaterial(
  data: MasterData,
  name: string,
  code?: string,
  jenis?: string,
  grade?: string,
  supplier?: string,
  unitCost?: string,
  description?: string
): MasterData {
  const newMaterial: MasterMaterial = {
    id: generateMasterId(),
    name,
    code,
    jenis,
    grade,
    supplier,
    unitCost,
    description,
    createdAt: new Date().toISOString(),
    usageCount: 0,
  };
  return {
    ...data,
    materials: [...data.materials, newMaterial],
  };
}

export function updateMaterial(
  data: MasterData,
  id: string,
  updates: Partial<MasterMaterial>
): MasterData {
  return {
    ...data,
    materials: data.materials.map((m) => (m.id === id ? { ...m, ...updates } : m)),
  };
}

export function deleteMaterial(data: MasterData, id: string): MasterData {
  return {
    ...data,
    materials: data.materials.filter((m) => m.id !== id),
  };
}

// Increment usage count
export function incrementModulUsage(data: MasterData, modulId: string): MasterData {
  return {
    ...data,
    moduls: data.moduls.map((m) =>
      m.id === modulId ? { ...m, usageCount: m.usageCount + 1 } : m
    ),
  };
}

export function incrementSubModulUsage(data: MasterData, submodulId: string): MasterData {
  return {
    ...data,
    submoduls: data.submoduls.map((s) =>
      s.id === submodulId ? { ...s, usageCount: s.usageCount + 1 } : s
    ),
  };
}

export function incrementMaterialUsage(data: MasterData, materialId: string): MasterData {
  return {
    ...data,
    materials: data.materials.map((m) =>
      m.id === materialId ? { ...m, usageCount: m.usageCount + 1 } : m
    ),
  };
}

// Get functions
export function getModulById(data: MasterData, id: string): MasterModul | undefined {
  return data.moduls.find((m) => m.id === id);
}

export function getSubModulById(data: MasterData, id: string): MasterSubModul | undefined {
  return data.submoduls.find((s) => s.id === id);
}

export function getMaterialById(data: MasterData, id: string): MasterMaterial | undefined {
  return data.materials.find((m) => m.id === id);
}

export function getSubModulsByModulId(
  data: MasterData,
  modulId: string
): MasterSubModul[] {
  return data.submoduls.filter((s) => s.modulId === modulId);
}
