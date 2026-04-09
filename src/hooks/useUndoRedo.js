import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY = 20;

/**
 * useUndoRedo — history stack untuk undo/redo (min 20 level).
 * @param {Array} initialValue — array (misal bomRows) yang akan di-track
 * @param {(next: Array) => void} setValue — setter (misal setBomRows dari context)
 * @returns {{ value: Array, setValue: (next: Array) => void, execute: (updater: (prev: Array) => Array) => void, undo: () => void, redo: () => void, canUndo: boolean, canRedo: boolean, lastAction: string | null }}
 */
export function useUndoRedo(initialValue, setValue) {
  const [history, setHistory] = useState(() => [initialValue]);
  const [index, setIndex] = useState(0);
  const lastActionRef = useRef(null);

  const current = history[index];

  const execute = useCallback(
    (updater) => {
      const next = updater(current);
      if (next === current) return;
      const newHistory = history.slice(0, index + 1);
      newHistory.push(next);
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      setIndex(newHistory.length - 1);
      setHistory(newHistory);
      setValue(next);
      lastActionRef.current = 'edit';
    },
    [current, history, index, setValue]
  );

  const undo = useCallback(() => {
    if (index <= 0) return;
    const prevIndex = index - 1;
    setIndex(prevIndex);
    setValue(history[prevIndex]);
    lastActionRef.current = 'undo';
  }, [index, history, setValue]);

  const redo = useCallback(() => {
    if (index >= history.length - 1) return;
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setValue(history[nextIndex]);
    lastActionRef.current = 'redo';
  }, [index, history, setValue]);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  return {
    value: current,
    setValue: (next) => {
      setHistory([next]);
      setIndex(0);
      setValue(next);
      lastActionRef.current = null;
    },
    execute,
    undo,
    redo,
    canUndo,
    canRedo,
    lastAction: lastActionRef.current,
    resetHistory: useCallback(() => {
      setHistory([current]);
      setIndex(0);
    }, [current]),
  };
}
