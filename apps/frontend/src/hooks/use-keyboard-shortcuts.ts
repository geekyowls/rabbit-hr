import { useEffect, useCallback, useRef } from 'react';

type ModifierKey = 'ctrl' | 'meta' | 'alt' | 'shift';

interface KeyboardShortcut {
  key: string;
  modifiers?: ModifierKey[];
  handler: (event: KeyboardEvent) => void;
  description?: string;
  skipInputs?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  scope?: 'global' | 'local';
  skipWhenDialogOpen?: boolean;
}

const INPUT_ELEMENTS = ['INPUT', 'TEXTAREA', 'SELECT'];
const EDITABLE_ROLES = ['textbox', 'searchbox', 'combobox'];

function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  if (INPUT_ELEMENTS.includes(activeElement.tagName)) {
    return true;
  }

  if ((activeElement as HTMLElement).isContentEditable) {
    return true;
  }

  const role = activeElement.getAttribute('role');
  if (role && EDITABLE_ROLES.includes(role)) {
    return true;
  }

  return false;
}

function isDialogOpen(): boolean {
  return document.querySelector('[role="dialog"]') !== null;
}

function matchesModifiers(
  event: KeyboardEvent,
  modifiers?: ModifierKey[],
): boolean {
  const required = modifiers ?? [];

  const ctrlRequired = required.includes('ctrl');
  const metaRequired = required.includes('meta');
  const altRequired = required.includes('alt');
  const shiftRequired = required.includes('shift');

  const ctrlOrMeta = ctrlRequired || metaRequired;
  const ctrlOrMetaPressed = event.ctrlKey || event.metaKey;

  if (ctrlOrMeta && !ctrlOrMetaPressed) return false;
  if (!ctrlOrMeta && ctrlOrMetaPressed) return false;

  if (altRequired !== event.altKey) return false;
  if (shiftRequired !== event.shiftKey) return false;

  return true;
}

function normalizeKey(key?: string | null): string {
  if (typeof key !== 'string') return '';
  return key.toLowerCase();
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {},
) {
  const { enabled = true, skipWhenDialogOpen = false } = options;
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      if (skipWhenDialogOpen && isDialogOpen()) return;

      const pressedKey = normalizeKey(event.key);
      if (!pressedKey) return;

      for (const shortcut of shortcutsRef.current) {
        const targetKey = normalizeKey(shortcut.key);
        if (!targetKey) continue;

        if (pressedKey !== targetKey) continue;
        if (!matchesModifiers(event, shortcut.modifiers)) continue;

        const shouldSkipInputs = shortcut.skipInputs !== false;
        if (shouldSkipInputs && isInputFocused()) continue;

        event.preventDefault();
        event.stopPropagation();
        shortcut.handler(event);
        return;
      }
    },
    [enabled, skipWhenDialogOpen],
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

export function useKeyboardShortcut(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: Omit<KeyboardShortcut, 'key' | 'handler'> &
    UseKeyboardShortcutsOptions = {},
) {
  const { modifiers, description, skipInputs, ...restOptions } = options;

  const shortcuts: KeyboardShortcut[] = [
    {
      key,
      modifiers,
      handler,
      description,
      skipInputs,
    },
  ];

  useKeyboardShortcuts(shortcuts, restOptions);
}

export function formatShortcut(key: string, modifiers?: ModifierKey[]): string {
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
  const parts: string[] = [];

  if (modifiers?.includes('ctrl') || modifiers?.includes('meta')) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (modifiers?.includes('alt')) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (modifiers?.includes('shift')) {
    parts.push(isMac ? '⇧' : 'Shift');
  }

  const displayKey = key.length === 1 ? key.toUpperCase() : key;
  parts.push(displayKey);

  return parts.join(isMac ? '' : '+');
}

export type { KeyboardShortcut, ModifierKey, UseKeyboardShortcutsOptions };
