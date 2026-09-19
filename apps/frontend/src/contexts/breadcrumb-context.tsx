'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { BreadcrumbItem } from '@/components/ui/breadcrumb';

interface BreadcrumbContextValue {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItem[]>([]);

  return (
    <BreadcrumbContext.Provider value={{ items, setItems }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx)
    throw new Error(
      'useBreadcrumbContext must be used within BreadcrumbProvider',
    );
  return ctx;
}

export function useBreadcrumb(items: BreadcrumbItem[]) {
  const { setItems } = useBreadcrumbContext();
  const serialized = JSON.stringify(items);

  useEffect(() => {
    setItems(JSON.parse(serialized) as BreadcrumbItem[]);
    return () => setItems([]);
  }, [serialized, setItems]);
}
