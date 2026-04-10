const DEFAULT_LOCAL_STORAGE_CAPACITY_BYTES = 5 * 1024 * 1024;

export interface StoragePressure {
  usedBytes: number;
  capacityBytes: number;
  usageRatio: number;
  usagePercent: number;
  isHigh: boolean;
}

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function estimateStorageBytes(storage: Storage): number {
  let total = 0;
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key == null) continue;
    const value = storage.getItem(key) ?? '';
    // UTF-16 approximation: 2 bytes per char.
    total += (key.length + value.length) * 2;
  }
  return total;
}

export function getLocalStoragePressure(
  capacityBytes = DEFAULT_LOCAL_STORAGE_CAPACITY_BYTES,
): StoragePressure | null {
  const storage = safeStorage();
  if (!storage) return null;
  const usedBytes = estimateStorageBytes(storage);
  const usageRatio = capacityBytes > 0 ? usedBytes / capacityBytes : 0;
  const usagePercent = Math.min(100, Math.round(usageRatio * 100));
  return {
    usedBytes,
    capacityBytes,
    usageRatio,
    usagePercent,
    isHigh: usageRatio >= 0.8,
  };
}
