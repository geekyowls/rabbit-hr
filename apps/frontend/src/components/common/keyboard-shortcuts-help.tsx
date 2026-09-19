'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { KeyboardShortcut } from '@/components/ui/keyboard-shortcut';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcuts';

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  name: string;
  shortcuts: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    name: 'Global',
    shortcuts: [
      { keys: ['Cmd', 'K'], description: 'Open command palette' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
  {
    name: 'Diet Grid (when focused)',
    shortcuts: [
      { keys: ['←', '→', '↑', '↓'], description: 'Navigate cells' },
      { keys: ['Enter'], description: 'Edit cell' },
      { keys: ['C'], description: 'Copy cell' },
      { keys: ['V'], description: 'Paste (in copy mode)' },
      { keys: ['S'], description: 'Swap cell' },
      { keys: ['Escape'], description: 'Cancel operation' },
      { keys: ['Home'], description: 'First cell in row' },
      { keys: ['End'], description: 'Last cell in row' },
      { keys: ['Cmd', 'Home'], description: 'First cell' },
      { keys: ['Cmd', 'End'], description: 'Last cell' },
    ],
  },
];

interface KeyboardShortcutsHelpProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
}: KeyboardShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const dialogOpen = open ?? isOpen;
  const setDialogOpen = onOpenChange ?? setIsOpen;

  useKeyboardShortcut('?', () => setDialogOpen(true), {
    skipInputs: true,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !isInputFocused()) {
        e.preventDefault();
        setDialogOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setDialogOpen]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto pr-2 -mr-2">
          <div className="grid gap-6">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.name}>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  {group.name}
                </h3>
                <div className="grid gap-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
                    >
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <KeyboardShortcut keys={shortcut.keys} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Press <KeyboardShortcut keys={['Escape']} /> to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const inputElements = ['INPUT', 'TEXTAREA', 'SELECT'];
  if (inputElements.includes(activeElement.tagName)) {
    return true;
  }

  if ((activeElement as HTMLElement).isContentEditable) {
    return true;
  }

  return false;
}
