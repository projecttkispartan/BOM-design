import { useState, useCallback, useEffect } from 'react';

/**
 * useUnsavedChanges — tracking perubahan belum disimpan.
 * - changeCount naik setiap markChanged(), reset saat markSaved()
 * - beforeunload warning bila isDirty
 * - optional: update document.title dengan dot
 * @param {Object} options
 * @param {() => void} [options.onSave] — callback saat user trigger save (untuk integrasi)
 * @param {string} [options.pageTitle] — judul halaman untuk ditambah dot (contoh: "BoM")
 * @returns {{ isDirty: boolean, changeCount: number, markChanged: () => void, markSaved: () => void }}
 */
export function useUnsavedChanges(options = {}) {
  const { pageTitle = 'BoM', onSave } = options;
  const [changeCount, setChangeCount] = useState(0);
  const isDirty = changeCount > 0;

  const markChanged = useCallback(() => {
    setChangeCount((c) => c + 1);
  }, []);

  const markSaved = useCallback(() => {
    setChangeCount(0);
    if (onSave) onSave();
  }, [onSave]);

  useEffect(() => {
    if (!pageTitle) return;
    document.title = isDirty ? `• ${pageTitle}` : pageTitle;
    return () => {
      document.title = pageTitle;
    };
  }, [isDirty, pageTitle]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return {
    isDirty,
    changeCount,
    markChanged,
    markSaved,
  };
}
