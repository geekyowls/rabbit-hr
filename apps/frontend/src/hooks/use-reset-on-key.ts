import { useEffect, useRef } from 'react';

export function useResetOnKey(key: string | null, apply: () => void) {
  const applied = useRef<string | null>(null);
  useEffect(() => {
    if (key === applied.current) return;
    applied.current = key;
    if (key !== null) apply();
  }, [key, apply]);
}
