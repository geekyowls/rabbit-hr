'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UnsavedChangesContextValue {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  confirmNavigation: (onConfirm: () => void) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(
  null,
);

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error(
      'useUnsavedChanges must be used within UnsavedChangesProvider',
    );
  }
  return context;
}

interface UnsavedChangesProviderProps {
  children: ReactNode;
}

export function UnsavedChangesProvider({
  children,
}: UnsavedChangesProviderProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const setDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  const confirmNavigation = useCallback(
    (onConfirm: () => void) => {
      if (!isDirty) {
        onConfirm();
        return;
      }
      pendingActionRef.current = onConfirm;
      setDialogOpen(true);
    },
    [isDirty],
  );

  const handleStay = useCallback(() => {
    pendingActionRef.current = null;
    setDialogOpen(false);
  }, []);

  const handleLeave = useCallback(() => {
    setDialogOpen(false);
    setIsDirty(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) {
      action();
    }
  }, []);

  return (
    <UnsavedChangesContext.Provider
      value={{ isDirty, setDirty, confirmNavigation }}
    >
      {children}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you leave this page, they will be
              lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStay}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave}>
              Leave anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnsavedChangesContext.Provider>
  );
}
