'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PermissionScope } from '@/constants/permissions.constants';
import { ScopeSelector } from './scope-selector';
import {
  type PermissionSubGroup as SubGroupType,
  type PermissionAction,
  getAllPermissionsForSubGroup,
  isActionEnabled,
  getActionScope,
  countEnabledActions,
  applyConstraintsOnToggle,
  applyConstraintsOnScopeChange,
} from './permission-ui-config';

interface PermissionSubGroupProps {
  subGroup: SubGroupType;
  selected: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

export function PermissionSubGroup({
  subGroup,
  selected,
  onChange,
  disabled,
}: PermissionSubGroupProps) {
  const enabledCount = countEnabledActions(subGroup.actions, selected);
  const totalCount = subGroup.actions.length;
  const allSelected = enabledCount === totalCount && totalCount > 0;
  const someSelected = enabledCount > 0 && !allSelected;

  const toggleSelectAll = () => {
    const allPerms = getAllPermissionsForSubGroup(subGroup);
    if (allSelected) {
      onChange(selected.filter((p) => !allPerms.includes(p)));
    } else {
      const withoutGroup = selected.filter((p) => !allPerms.includes(p));
      const maxPerms = subGroup.actions.flatMap((action) => {
        if (action.type === 'simple') return [action.permission];
        return [action.permissions.all];
      });
      onChange([...withoutGroup, ...maxPerms]);
    }
  };

  const toggleAction = (action: PermissionAction) => {
    const enabled = isActionEnabled(action, selected);
    const allPerms = getAllPermissionsForSubGroup(subGroup);
    const withoutGroup = selected.filter((p) => !allPerms.includes(p));
    const groupPerms = selected.filter((p) => allPerms.includes(p));

    const constrained = applyConstraintsOnToggle(
      action,
      !enabled,
      subGroup.actions,
      groupPerms,
    );
    onChange([...withoutGroup, ...constrained]);
  };

  const changeScope = (action: PermissionAction, scope: PermissionScope) => {
    if (action.type === 'simple') return;
    const allPerms = getAllPermissionsForSubGroup(subGroup);
    const withoutGroup = selected.filter((p) => !allPerms.includes(p));
    const groupPerms = selected.filter((p) => allPerms.includes(p));

    const constrained = applyConstraintsOnScopeChange(
      action,
      scope,
      subGroup.actions,
      groupPerms,
    );
    onChange([...withoutGroup, ...constrained]);
  };

  const checkedState = allSelected
    ? true
    : someSelected
      ? ('indeterminate' as const)
      : false;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`subgroup-${subGroup.key}`}
              checked={checkedState}
              onCheckedChange={toggleSelectAll}
              disabled={disabled}
            />
            <CardTitle className="text-sm">
              <Label
                htmlFor={`subgroup-${subGroup.key}`}
                className="cursor-pointer font-medium"
              >
                {subGroup.label}
              </Label>
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {enabledCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2.5">
          {subGroup.actions.map((action) => {
            const actionKey =
              action.type === 'simple'
                ? action.permission
                : action.permissions.own;
            const enabled = isActionEnabled(action, selected);
            const scope =
              action.type === 'scoped'
                ? getActionScope(action, selected)
                : null;

            return (
              <div
                key={actionKey}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`perm-${actionKey}`}
                    checked={enabled}
                    onCheckedChange={() => toggleAction(action)}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={`perm-${actionKey}`}
                    className="text-sm text-muted-foreground cursor-pointer font-normal"
                  >
                    {action.label}
                  </Label>
                </div>
                {action.type === 'scoped' && enabled && (
                  <ScopeSelector
                    value={scope}
                    onChange={(s) => changeScope(action, s)}
                    disabled={disabled}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
