import { bomApiClient } from '@/lib/bomApiClient';

const MIGRATION_KEY = 'bom-db-migration-v1';
const DOCS_KEY = 'bom-app-documents';
const LEGACY_STATE_KEY = 'bom-app-state';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function migrateLocalStorageToApi() {
  if (typeof window === 'undefined') {
    return { migrated: false, reason: 'server' as const };
  }
  if (localStorage.getItem(MIGRATION_KEY) === 'done') {
    return { migrated: false, reason: 'already' as const };
  }

  const docs = safeParse<unknown[]>(localStorage.getItem(DOCS_KEY)) || [];
  const legacyState = safeParse<unknown>(localStorage.getItem(LEGACY_STATE_KEY));
  if (docs.length === 0 && !legacyState) {
    localStorage.setItem(MIGRATION_KEY, 'done');
    return { migrated: false, reason: 'empty' as const };
  }

  const result = await bomApiClient.migrateLocalData({ docs, legacyState: legacyState || undefined });
  if (!result.errors.length) {
    localStorage.setItem(MIGRATION_KEY, 'done');
  }
  return {
    migrated: result.imported > 0,
    reason: 'executed' as const,
    result,
  };
}
