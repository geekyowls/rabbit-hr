'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

interface FocusModeContextValue {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  exitFocusMode: () => void;
}

const FocusModeContext = createContext<FocusModeContextValue | null>(null);

export function useFocusMode() {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error('useFocusMode must be used within FocusModeProvider');
  }
  return context;
}

interface FocusModeProviderProps {
  children: ReactNode;
}

export function FocusModeProvider({ children }: FocusModeProviderProps) {
  const [isFocusMode, setIsFocusMode] = useState(false);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
  }, []);

  const exitFocusMode = useCallback(() => {
    setIsFocusMode(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !isFocusMode) return;

      const target = e.target as HTMLElement;
      const isInsideDialog =
        target.closest('[role="dialog"]') ||
        target.closest('[data-radix-popper-content-wrapper]');
      if (isInsideDialog) return;

      exitFocusMode();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, exitFocusMode]);

  return (
    <FocusModeContext.Provider
      value={{ isFocusMode, toggleFocusMode, exitFocusMode }}
    >
      {children}
    </FocusModeContext.Provider>
  );
}
