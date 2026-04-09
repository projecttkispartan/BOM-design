import { useState, useCallback, useEffect } from 'react';

interface Options {
  pageTitle?: string;
  onSave?: () => void;
}

export function useUnsavedChanges(options: Options = {}) {
  const { pageTitle = 'BoM', onSave } = options;
  const [changeCount, setChangeCount] = useState(0);
  const isDirty = changeCount > 0;

  const markChanged = useCallback(() => setChangeCount((c) => c + 1), []);
  const markSaved = useCallback(() => {
    setChangeCount(0);
    onSave?.();
  }, [onSave]);

  useEffect(() => {
    if (!pageTitle || typeof document === 'undefined') return;
    document.title = isDirty ? `• ${pageTitle}` : pageTitle;
    return () => { document.title = pageTitle; };
  }, [isDirty, pageTitle]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return { isDirty, changeCount, markChanged, markSaved };
}
