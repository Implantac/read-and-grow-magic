import { useCallback, useEffect, useState } from 'react';

const KEY = 'manual-progress-v1';

function read(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function write(set: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore */
  }
}

export function useManualProgress() {
  const [done, setDone] = useState<Set<string>>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setDone(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isDone = useCallback((slug: string) => done.has(slug), [done]);

  const toggle = useCallback((slug: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      write(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setDone(new Set());
    write(new Set());
  }, []);

  return { done, isDone, toggle, reset, count: done.size };
}
