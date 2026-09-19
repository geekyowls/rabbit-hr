import {
  PERMISSION_GROUPS,
  PermissionScope,
} from '@/constants/permissions.constants';

type ScopedAction = {
  type: 'scoped';
  label: string;
  permissions: { own: string; team: string; all: string };
};

type SimpleAction = {
  type: 'simple';
  label: string;
  permission: string;
};

export type PermissionAction = ScopedAction | SimpleAction;

export type PermissionSubGroup = {
  key: string;
  label: string;
  actions: PermissionAction[];
};

export type PermissionUISection = {
  key: string;
  label: string;
  subGroups: PermissionSubGroup[];
};

const ACTION_LABELS: Record<string, string> = {
  'list:read': 'View List',
  read: 'View Details',
  update: 'Edit',
  create: 'Create',
  delete: 'Delete',
  assign: 'Assign',
  'update-status': 'Update Status',
  'submission:read': 'View Submissions',
  'submission:delete': 'Delete Submissions',
  connect: 'Connect',
  disconnect: 'Disconnect',
  impersonate: 'Impersonate',
  settings: 'Manage Settings',
  manage: 'Manage',
};

function extractPrefix(permission: string): string {
  const parts = permission.split(':');
  return parts[0];
}

function buildActionsFromGroup(groupKey: string): PermissionAction[] {
  const group = PERMISSION_GROUPS[groupKey];
  if (!group) return [];

  const permissions = group.permissions;
  const prefix = extractPrefix(permissions[0]);

  const scopeBases = new Map<
    string,
    { own?: string; team?: string; all?: string }
  >();
  const simplePerms: string[] = [];

  for (const perm of permissions) {
    const withoutPrefix = perm.slice(prefix.length + 1);

    if (withoutPrefix.endsWith(`:${PermissionScope.OWN}`)) {
      const base = withoutPrefix.slice(0, -(PermissionScope.OWN.length + 1));
      const entry = scopeBases.get(base) || {};
      entry.own = perm;
      scopeBases.set(base, entry);
    } else if (withoutPrefix.endsWith(`:${PermissionScope.TEAM}`)) {
      const base = withoutPrefix.slice(0, -(PermissionScope.TEAM.length + 1));
      const entry = scopeBases.get(base) || {};
      entry.team = perm;
      scopeBases.set(base, entry);
    } else if (withoutPrefix.endsWith(`:${PermissionScope.ALL}`)) {
      const base = withoutPrefix.slice(0, -(PermissionScope.ALL.length + 1));
      const entry = scopeBases.get(base) || {};
      entry.all = perm;
      scopeBases.set(base, entry);
    } else {
      simplePerms.push(perm);
    }
  }

  const actions: PermissionAction[] = [];

  const processedSimple = new Set<string>();

  for (const [base, scopes] of scopeBases) {
    if (scopes.own && scopes.team && scopes.all) {
      const label =
        ACTION_LABELS[base] ||
        base.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      actions.push({
        type: 'scoped',
        label,
        permissions: { own: scopes.own, team: scopes.team, all: scopes.all },
      });
    } else {
      if (scopes.own) simplePerms.push(scopes.own);
      if (scopes.team) simplePerms.push(scopes.team);
      if (scopes.all) simplePerms.push(scopes.all);
    }
  }

  for (const perm of simplePerms) {
    if (processedSimple.has(perm)) continue;
    processedSimple.add(perm);

    const withoutPrefix = perm.slice(prefix.length + 1);
    const label =
      ACTION_LABELS[withoutPrefix] ||
      withoutPrefix.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    actions.push({ type: 'simple', label, permission: perm });
  }

  return actions;
}

function buildSubGroup(groupKey: string): PermissionSubGroup {
  const group = PERMISSION_GROUPS[groupKey];
  return {
    key: groupKey,
    label: group?.label || groupKey,
    actions: buildActionsFromGroup(groupKey),
  };
}

const SECTION_CONFIG: { key: string; label: string; groupKeys: string[] }[] = [
  {
    key: 'notifications',
    label: 'Notifications',
    groupKeys: ['notifications', 'notificationsDailyDigest'],
  },
  {
    key: 'settings',
    label: 'Settings',
    groupKeys: [
      'users',
      'roles',
      'organization',
      'audit',
      'integrations',
      'teams',
    ],
  },
];

export const PERMISSION_UI_SECTIONS: PermissionUISection[] = SECTION_CONFIG.map(
  (config) => ({
    key: config.key,
    label: config.label,
    subGroups: config.groupKeys.map(buildSubGroup),
  }),
);

export function getAllPermissionsForAction(action: PermissionAction): string[] {
  if (action.type === 'simple') return [action.permission];
  return [
    action.permissions.own,
    action.permissions.team,
    action.permissions.all,
  ];
}

export function getAllPermissionsForSubGroup(
  subGroup: PermissionSubGroup,
): string[] {
  return subGroup.actions.flatMap(getAllPermissionsForAction);
}

export function getAllPermissionsForSection(
  section: PermissionUISection,
): string[] {
  return section.subGroups.flatMap(getAllPermissionsForSubGroup);
}

export function isActionEnabled(
  action: PermissionAction,
  selected: string[],
): boolean {
  if (action.type === 'simple') return selected.includes(action.permission);
  return (
    selected.includes(action.permissions.own) ||
    selected.includes(action.permissions.team) ||
    selected.includes(action.permissions.all)
  );
}

export function getActionScope(
  action: PermissionAction,
  selected: string[],
): PermissionScope | null {
  if (action.type === 'simple') return null;
  if (selected.includes(action.permissions.all)) return PermissionScope.ALL;
  if (selected.includes(action.permissions.team)) return PermissionScope.TEAM;
  if (selected.includes(action.permissions.own)) return PermissionScope.OWN;
  return null;
}

export function countEnabledActions(
  actions: PermissionAction[],
  selected: string[],
): number {
  return actions.filter((a) => isActionEnabled(a, selected)).length;
}

const SCOPE_RANK: Record<string, number> = {
  [PermissionScope.OWN]: 0,
  [PermissionScope.TEAM]: 1,
  [PermissionScope.ALL]: 2,
};

const SCOPED_ACTION_TIER: Record<string, number> = {
  'list:read': 0,
  read: 1,
  update: 2,
};

function getScopedActionBase(action: PermissionAction): string | null {
  if (action.type !== 'scoped') return null;
  const parts = action.permissions.own.split(':');
  return parts.slice(1, -1).join(':');
}

function getScopedActionTier(action: PermissionAction): number {
  const base = getScopedActionBase(action);
  if (base === null) return -1;
  return SCOPED_ACTION_TIER[base] ?? -1;
}

function scopeAtLeast(
  scope: PermissionScope,
  minScope: PermissionScope,
): PermissionScope {
  return SCOPE_RANK[scope] >= SCOPE_RANK[minScope] ? scope : minScope;
}

function scopeAtMost(
  scope: PermissionScope,
  maxScope: PermissionScope,
): PermissionScope {
  return SCOPE_RANK[scope] <= SCOPE_RANK[maxScope] ? scope : maxScope;
}

const SIMPLE_REQUIRES_LIST_READ = new Set([
  'Delete',
  'Assign',
  'Update Status',
]);

export function applyConstraintsOnToggle(
  action: PermissionAction,
  enabling: boolean,
  actions: PermissionAction[],
  selected: string[],
): string[] {
  const scopedActions = actions
    .filter((a) => a.type === 'scoped' && getScopedActionTier(a) >= 0)
    .sort((a, b) => getScopedActionTier(a) - getScopedActionTier(b));

  const listReadAction = scopedActions.find(
    (a) => getScopedActionTier(a) === 0,
  );

  let result = [...selected];

  const removeAction = (a: PermissionAction) => {
    const perms = getAllPermissionsForAction(a);
    result = result.filter((p) => !perms.includes(p));
  };

  const addAction = (a: PermissionAction, scope: PermissionScope) => {
    removeAction(a);
    if (a.type === 'scoped') {
      result.push(a.permissions[scope]);
    } else {
      result.push(a.permission);
    }
  };

  if (enabling) {
    if (action.type === 'scoped') {
      const tier = getScopedActionTier(action);
      const defaultScope = PermissionScope.OWN;
      addAction(action, defaultScope);

      for (const sa of scopedActions) {
        const saTier = getScopedActionTier(sa);
        if (saTier < tier && !isActionEnabled(sa, result)) {
          addAction(sa, defaultScope);
        }
      }
    } else {
      result.push(action.permission);
      if (
        SIMPLE_REQUIRES_LIST_READ.has(action.label) &&
        listReadAction &&
        !isActionEnabled(listReadAction, result)
      ) {
        addAction(listReadAction, PermissionScope.OWN);
      }
    }
  } else {
    if (action.type === 'scoped') {
      const tier = getScopedActionTier(action);
      removeAction(action);

      for (const sa of scopedActions) {
        if (getScopedActionTier(sa) > tier) {
          removeAction(sa);
        }
      }

      if (tier === 0) {
        for (const a of actions) {
          if (
            a.type === 'simple' &&
            SIMPLE_REQUIRES_LIST_READ.has(a.label) &&
            isActionEnabled(a, result)
          ) {
            result = result.filter((p) => p !== a.permission);
          }
        }
      }
    } else {
      result = result.filter((p) => p !== action.permission);
    }
  }

  return result;
}

export function applyConstraintsOnScopeChange(
  action: PermissionAction,
  newScope: PermissionScope,
  actions: PermissionAction[],
  selected: string[],
): string[] {
  if (action.type !== 'scoped') return selected;

  const scopedActions = actions
    .filter((a) => a.type === 'scoped' && getScopedActionTier(a) >= 0)
    .sort((a, b) => getScopedActionTier(a) - getScopedActionTier(b));

  const tier = getScopedActionTier(action);
  let result = [...selected];

  const setScope = (a: PermissionAction, scope: PermissionScope) => {
    if (a.type !== 'scoped') return;
    const perms = getAllPermissionsForAction(a);
    result = result.filter((p) => !perms.includes(p));
    result.push(a.permissions[scope]);
  };

  setScope(action, newScope);

  for (const sa of scopedActions) {
    const saTier = getScopedActionTier(sa);
    if (saTier < tier && isActionEnabled(sa, result)) {
      const currentScope = getActionScope(sa, result);
      if (currentScope && SCOPE_RANK[currentScope] < SCOPE_RANK[newScope]) {
        setScope(sa, scopeAtLeast(currentScope, newScope));
      }
    }
    if (saTier > tier && isActionEnabled(sa, result)) {
      const currentScope = getActionScope(sa, result);
      if (currentScope && SCOPE_RANK[currentScope] > SCOPE_RANK[newScope]) {
        setScope(sa, scopeAtMost(currentScope, newScope));
      }
    }
  }

  return result;
}
