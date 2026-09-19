'use client';

import { cn } from '@/lib/utils';

interface KeyboardShortcutProps {
  keys: string[];
  className?: string;
  separator?: string;
}

const KEY_DISPLAY_MAP: Record<string, string> = {
  cmd: '⌘',
  ctrl: 'Ctrl',
  meta: '⌘',
  alt: '⌥',
  option: '⌥',
  shift: '⇧',
  enter: '↵',
  return: '↵',
  escape: 'Esc',
  esc: 'Esc',
  tab: '⇥',
  space: '␣',
  backspace: '⌫',
  delete: '⌦',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  pageup: 'PgUp',
  pagedown: 'PgDn',
  home: 'Home',
  end: 'End',
};

function formatKey(key: string): string {
  const lowerKey = key.toLowerCase();
  return KEY_DISPLAY_MAP[lowerKey] || key.toUpperCase();
}

export function KeyboardShortcut({
  keys,
  className,
  separator = '',
}: KeyboardShortcutProps) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {keys.map((key, index) => (
        <span key={index} className="inline-flex items-center">
          <kbd
            className={cn(
              'inline-flex items-center justify-center',
              'h-5 min-w-[20px] px-1.5',
              'text-[11px] font-medium leading-none',
              'bg-muted border border-border rounded',
              'text-muted-foreground',
              'shadow-sm',
            )}
          >
            {formatKey(key)}
          </kbd>
          {index < keys.length - 1 && separator && (
            <span className="mx-0.5 text-muted-foreground text-xs">
              {separator}
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

interface KeyboardShortcutInlineProps {
  shortcut: string;
  className?: string;
}

export function KeyboardShortcutInline({
  shortcut,
  className,
}: KeyboardShortcutInlineProps) {
  const parts = shortcut.split(/[+\s]+/).filter(Boolean);
  return <KeyboardShortcut keys={parts} className={className} />;
}
