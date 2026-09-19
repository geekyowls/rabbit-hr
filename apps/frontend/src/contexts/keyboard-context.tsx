'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

interface ShortcutRegistration {
  id: string;
  key: string;
  modifiers?: string[];
  description: string;
  context: string;
}

interface KeyboardContextValue {
  shortcuts: ShortcutRegistration[];
  registerShortcut: (shortcut: ShortcutRegistration) => void;
  unregisterShortcut: (id: string) => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  dialogCount: number;
  pushDialog: () => void;
  popDialog: () => void;
}

const KeyboardContext = createContext<KeyboardContextValue | null>(null);

interface KeyboardProviderProps {
  children: ReactNode;
}

export function KeyboardProvider({ children }: KeyboardProviderProps) {
  const [shortcuts, setShortcuts] = useState<ShortcutRegistration[]>([]);
  const [isEnabled, setEnabled] = useState(true);
  const [dialogCount, setDialogCount] = useState(0);

  const registerShortcut = useCallback((shortcut: ShortcutRegistration) => {
    setShortcuts((prev) => {
      const exists = prev.some((s) => s.id === shortcut.id);
      if (exists) {
        return prev.map((s) => (s.id === shortcut.id ? shortcut : s));
      }
      return [...prev, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const pushDialog = useCallback(() => {
    setDialogCount((prev) => prev + 1);
  }, []);

  const popDialog = useCallback(() => {
    setDialogCount((prev) => Math.max(0, prev - 1));
  }, []);

  const value = useMemo<KeyboardContextValue>(
    () => ({
      shortcuts,
      registerShortcut,
      unregisterShortcut,
      isEnabled: isEnabled && dialogCount === 0,
      setEnabled,
      dialogCount,
      pushDialog,
      popDialog,
    }),
    [
      shortcuts,
      registerShortcut,
      unregisterShortcut,
      isEnabled,
      dialogCount,
      pushDialog,
      popDialog,
    ],
  );

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboardContext() {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error(
      'useKeyboardContext must be used within a KeyboardProvider',
    );
  }
  return context;
}

export function useKeyboardEnabled() {
  const context = useContext(KeyboardContext);
  return context?.isEnabled ?? true;
}

export function useRegisteredShortcuts() {
  const context = useContext(KeyboardContext);
  return context?.shortcuts ?? [];
}

export function useShortcutsByContext() {
  const shortcuts = useRegisteredShortcuts();

  return useMemo(() => {
    const grouped: Record<string, ShortcutRegistration[]> = {};

    for (const shortcut of shortcuts) {
      if (!grouped[shortcut.context]) {
        grouped[shortcut.context] = [];
      }
      grouped[shortcut.context].push(shortcut);
    }

    return grouped;
  }, [shortcuts]);
}
