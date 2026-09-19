'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type TextSize = 'sm' | 'md' | 'lg' | 'xl';

export interface DisplayPrefs {
  textSize: TextSize;
  boldText: boolean;
}

export const DISPLAY_PREFS_STORAGE_KEY = 'rabbithr-display-prefs';

const DEFAULT_PREFS: DisplayPrefs = {
  textSize: 'md',
  boldText: false,
};

const DOM_ATTRIBUTES: Record<keyof DisplayPrefs, string> = {
  textSize: 'data-text-size',
  boldText: 'data-bold-text',
};

function applyPrefsToDom(prefs: DisplayPrefs) {
  const root = document.documentElement;
  (Object.keys(DOM_ATTRIBUTES) as Array<keyof DisplayPrefs>).forEach((key) => {
    root.setAttribute(DOM_ATTRIBUTES[key], String(prefs[key]));
  });
}

function readStoredPrefs(): DisplayPrefs {
  try {
    const raw = window.localStorage.getItem(DISPLAY_PREFS_STORAGE_KEY);
    return raw
      ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<DisplayPrefs>) }
      : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

interface DisplayPrefsContextValue extends DisplayPrefs {
  setPref: <K extends keyof DisplayPrefs>(
    key: K,
    value: DisplayPrefs[K],
  ) => void;
}

const DisplayPrefsContext = createContext<DisplayPrefsContextValue | null>(
  null,
);

export function DisplayPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<DisplayPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    setPrefs(readStoredPrefs());
  }, []);

  const setPref = useCallback(
    <K extends keyof DisplayPrefs>(key: K, value: DisplayPrefs[K]) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        try {
          window.localStorage.setItem(
            DISPLAY_PREFS_STORAGE_KEY,
            JSON.stringify(next),
          );
        } catch {
          void 0;
        }
        applyPrefsToDom(next);
        return next;
      });
    },
    [],
  );

  return (
    <DisplayPrefsContext.Provider value={{ ...prefs, setPref }}>
      {children}
    </DisplayPrefsContext.Provider>
  );
}

export function useDisplayPrefs() {
  const ctx = useContext(DisplayPrefsContext);
  if (!ctx) {
    throw new Error('useDisplayPrefs must be used within DisplayPrefsProvider');
  }
  return ctx;
}
