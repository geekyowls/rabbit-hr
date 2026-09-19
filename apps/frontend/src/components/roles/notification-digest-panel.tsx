'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';

interface NotificationDigestPanelProps {
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

const SCOPE_PERMS = [
  PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SCOPE_ASSIGNED,
  PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SCOPE_ALL,
] as const;

const SLOT_PERMS = [
  PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SLOT_MORNING,
  PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SLOT_AFTERNOON,
  PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SLOT_EVENING,
] as const;

const ALL_DIGEST_PERMS: string[] = [...SCOPE_PERMS, ...SLOT_PERMS];

const SLOT_LABELS: Record<(typeof SLOT_PERMS)[number], string> = {
  [PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SLOT_MORNING]:
    'Morning (8 AM IST)',
  [PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SLOT_AFTERNOON]:
    'Afternoon (2 PM IST)',
  [PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SLOT_EVENING]:
    'Evening (6 PM IST)',
};

export function NotificationDigestPanel({
  selected,
  onChange,
  disabled,
}: NotificationDigestPanelProps) {
  const hasScope = SCOPE_PERMS.some((p) => selected.includes(p));
  const hasAnySlot = SLOT_PERMS.some((p) => selected.includes(p));
  const enabled = hasScope && hasAnySlot;

  const scope = selected.includes(
    PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SCOPE_ALL,
  )
    ? 'all'
    : 'assigned';

  const stripAll = (perms: string[]) =>
    perms.filter((p) => !ALL_DIGEST_PERMS.includes(p));

  const toggleEnabled = (next: boolean) => {
    if (next) {
      onChange([
        ...stripAll(selected),
        PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SCOPE_ASSIGNED,
        PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SLOT_MORNING,
      ]);
    } else {
      onChange(stripAll(selected));
    }
  };

  const setScope = (value: 'assigned' | 'all') => {
    const scopeSet = new Set<string>(SCOPE_PERMS);
    const base = selected.filter((p) => !scopeSet.has(p));
    base.push(
      value === 'all'
        ? PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SCOPE_ALL
        : PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SCOPE_ASSIGNED,
    );
    onChange(base);
  };

  const toggleSlot = (perm: (typeof SLOT_PERMS)[number]) => {
    if (selected.includes(perm)) {
      onChange(selected.filter((p) => p !== perm));
    } else {
      onChange([...selected, perm]);
    }
  };

  const controlsDisabled = disabled || !enabled;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm">
              <Label
                htmlFor="digest-enabled"
                className="cursor-pointer font-medium"
              >
                Daily Digest Email
              </Label>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Email summary of pending diets and active subscriptions for users
              in this role.
            </p>
          </div>
          <Switch
            id="digest-enabled"
            checked={enabled}
            onCheckedChange={toggleEnabled}
            disabled={disabled}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Scope</Label>
          <Select
            value={scope}
            onValueChange={(v) => setScope(v as 'assigned' | 'all')}
            disabled={controlsDisabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="assigned">Assigned clients only</SelectItem>
              <SelectItem value="all">All clients in organization</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Send at</Label>
          <div className="space-y-2">
            {SLOT_PERMS.map((perm) => (
              <div key={perm} className="flex items-center space-x-2">
                <Checkbox
                  id={`slot-${perm}`}
                  checked={selected.includes(perm)}
                  onCheckedChange={() => toggleSlot(perm)}
                  disabled={controlsDisabled}
                />
                <Label
                  htmlFor={`slot-${perm}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {SLOT_LABELS[perm]}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
