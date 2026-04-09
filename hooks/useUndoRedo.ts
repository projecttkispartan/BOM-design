import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 30;
const BATCH_MS = 600;

/**
 * Generic undo/redo that stays in sync with external state changes.
 * Rapid sequential edits within BATCH_MS are coalesced into a single undo step.
 *
 * Uses a comparator function to detect external changes (avoids identity issues
 * with objects recreated every render).
 */
export function useUndoRedo<T>(
  externalValue: T,
  setValue: (next: T) => void,
  isEqual?: (a: T, b: T) => boolean,
) {
  const eq = isEqual ?? ((a: T, b: T) => a === b);
  const historyRef = useRef<T[]>([externalValue]);
  const indexRef = useRef(0);
  const selfSetRef = useRef(false);
  const lastExecRef = useRef(0);
  const [, bump] = useState(0);

  const current = historyRef.current[indexRef.current];
  if (!eq(externalValue, current) && !selfSetRef.current) {
    const trimmed = historyRef.current.slice(0, indexRef.current + 1);
    trimmed.push(externalValue);
    if (trimmed.length > MAX_HISTORY) trimmed.shift();
    historyRef.current = trimmed;
    indexRef.current = trimmed.length - 1;
  }
  selfSetRef.current = false;

  const execute = useCallback(
    (updater: (prev: T) => T) => {
      const cur = historyRef.current[indexRef.current];
      const next = updater(cur);
      if (eq(next, cur)) return;

      const now = Date.now();
      const shouldBatch = now - lastExecRef.current < BATCH_MS && indexRef.current > 0;
      lastExecRef.current = now;

      if (shouldBatch) {
        historyRef.current[indexRef.current] = next;
      } else {
        const trimmed = historyRef.current.slice(0, indexRef.current + 1);
        trimmed.push(next);
        if (trimmed.length > MAX_HISTORY) trimmed.shift();
        historyRef.current = trimmed;
        indexRef.current = trimmed.length - 1;
      }

      selfSetRef.current = true;
      setValue(next);
      bump((c) => c + 1);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setValue],
  );

  const undo = useCallback(() => {
    if (indexRef.current <= 0) return;
    indexRef.current -= 1;
    selfSetRef.current = true;
    setValue(historyRef.current[indexRef.current]);
    bump((c) => c + 1);
  }, [setValue]);

  const redo = useCallback(() => {
    if (indexRef.current >= historyRef.current.length - 1) return;
    indexRef.current += 1;
    selfSetRef.current = true;
    setValue(historyRef.current[indexRef.current]);
    bump((c) => c + 1);
  }, [setValue]);

  return {
    execute,
    undo,
    redo,
    canUndo: indexRef.current > 0,
    canRedo: indexRef.current < historyRef.current.length - 1,
  };
}
