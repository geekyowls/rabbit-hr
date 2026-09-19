'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

interface SidebarContextValue {
  collapsed: boolean;
  mounted: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsedState] = useState(true);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === 'false') {
      setCollapsedState(false);
    }
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
  }, []);

  const toggle = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider
      value={{ collapsed, mounted, toggle, setCollapsed }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
