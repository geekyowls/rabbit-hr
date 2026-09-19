'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  HomeIcon,
  Cog6ToothIcon,
  MoonIcon,
  SunIcon,
  ArrowRightStartOnRectangleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/contexts/session-context';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcuts';

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface CommandOption {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout, isLoggingOut } = useSession();

  const dialogOpen = open ?? isOpen;
  const setDialogOpen = onOpenChange ?? setIsOpen;

  const handleClose = useCallback(() => {
    setDialogOpen(false);
  }, [setDialogOpen]);

  const runCommand = useCallback(
    (command: () => void) => {
      handleClose();
      command();
    },
    [handleClose],
  );

  useKeyboardShortcut('k', () => setDialogOpen(true), {
    modifiers: ['meta'],
    skipInputs: true,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setDialogOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setDialogOpen]);

  useEffect(() => {
    const handleOpen = () => setDialogOpen(true);
    window.addEventListener('open-command-palette', handleOpen);
    return () => window.removeEventListener('open-command-palette', handleOpen);
  }, [setDialogOpen]);

  const navigationItems: CommandOption[] = [
    {
      id: 'overview',
      label: 'Go to Dashboard',
      icon: HomeIcon,
      action: () => router.push('/dashboard'),
    },
    {
      id: 'help',
      label: 'Go to Help',
      icon: QuestionMarkCircleIcon,
      action: () => router.push('/dashboard/help'),
    },
    {
      id: 'settings',
      label: 'Go to Settings',
      icon: Cog6ToothIcon,
      action: () => router.push('/dashboard/settings'),
    },
  ];

  const settingsItems: CommandOption[] = [
    {
      id: 'toggle-theme',
      label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: theme === 'dark' ? SunIcon : MoonIcon,
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
    {
      id: 'logout',
      label: isLoggingOut ? 'Logging out...' : 'Log Out',
      icon: isLoggingOut ? Loader2 : ArrowRightStartOnRectangleIcon,
      action: () => !isLoggingOut && logout(),
    },
  ];

  return (
    <CommandDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={() => runCommand(item.action)}
              className="flex items-center gap-2"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.shortcut && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {item.shortcut}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          {settingsItems.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={() => runCommand(item.action)}
              className={`flex items-center gap-2 ${item.id === 'logout' && isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={item.id === 'logout' && isLoggingOut}
            >
              <item.icon
                className={`h-4 w-4 ${item.id === 'logout' && isLoggingOut ? 'animate-spin' : ''}`}
              />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
