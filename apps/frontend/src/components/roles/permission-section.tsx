'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { AccordionItem, AccordionContent } from '@/components/ui/accordion';
import { PermissionSubGroup } from './permission-sub-group';
import { NotificationDigestPanel } from './notification-digest-panel';
import {
  type PermissionUISection,
  getAllPermissionsForSection,
  countEnabledActions,
} from './permission-ui-config';

interface PermissionSectionProps {
  section: PermissionUISection;
  selected: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

export function PermissionSection({
  section,
  selected,
  onChange,
  disabled,
}: PermissionSectionProps) {
  const visibleSubGroups = section.subGroups.filter(
    (sg) => sg.key !== 'notificationsDailyDigest',
  );
  const allActions = visibleSubGroups.flatMap((sg) => sg.actions);
  const enabledCount = countEnabledActions(allActions, selected);
  const totalCount = allActions.length;
  const allSelected = enabledCount === totalCount && totalCount > 0;
  const someSelected = enabledCount > 0 && !allSelected;

  const toggleSectionAll = () => {
    const allPerms = getAllPermissionsForSection({
      ...section,
      subGroups: visibleSubGroups,
    });
    if (allSelected) {
      onChange(selected.filter((p) => !allPerms.includes(p)));
    } else {
      const withoutSection = selected.filter((p) => !allPerms.includes(p));
      const maxPerms = allActions.flatMap((action) => {
        if (action.type === 'simple') return [action.permission];
        return [action.permissions.all];
      });
      onChange([...withoutSection, ...maxPerms]);
    }
  };

  const checkedState = allSelected
    ? true
    : someSelected
      ? ('indeterminate' as const)
      : false;

  return (
    <AccordionItem value={section.key}>
      <AccordionPrimitive.Header className="flex items-center">
        <div className="flex items-center gap-3 py-4">
          <Checkbox
            id={`section-${section.key}`}
            checked={checkedState}
            onCheckedChange={toggleSectionAll}
            onClick={(e) => e.stopPropagation()}
            disabled={disabled}
          />
          <Label className="cursor-pointer text-sm font-medium">
            {section.label}
          </Label>
          <Badge variant="outline" className="text-xs">
            {enabledCount}/{totalCount}
          </Badge>
        </div>
        <AccordionPrimitive.Trigger className="ml-auto py-4 [&[data-state=open]>svg]:rotate-180">
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 dark:text-zinc-400" />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionContent>
        {section.key === 'notifications' && (
          <NotificationDigestPanel
            selected={selected}
            onChange={onChange}
            disabled={disabled}
          />
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {visibleSubGroups.map((subGroup) => (
            <PermissionSubGroup
              key={subGroup.key}
              subGroup={subGroup}
              selected={selected}
              onChange={onChange}
              disabled={disabled}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
