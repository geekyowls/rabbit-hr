import { useEffect, useRef, useState, useCallback } from 'react';
import type { RefObject } from 'react';

export function useInfiniteScroll(options?: {
  observer?: IntersectionObserverInit;
  rootRef?: RefObject<Element | null>;
}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
      ...(options?.observer ?? {}),
      root: options?.rootRef?.current ?? options?.observer?.root ?? null,
    };

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      observerOptions,
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options?.observer, options?.rootRef]);

  const reset = useCallback(() => {
    setIsIntersecting(false);
  }, []);

  return { ref, isIntersecting, reset };
}
