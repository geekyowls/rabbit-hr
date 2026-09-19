'use client';

import { useState, useEffect, useMemo } from 'react';
import { MultiSelect } from '@/components/ui/multi-select';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { PermissionScope } from '@/constants/permissions.constants';

export const UNASSIGNED_VALUE = 'unassigned';

interface UserOption {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface AssignedToFilterProps {
  scope: PermissionScope | null;
  value: string[];
  onChange: (userIds: string[]) => void;
  showUnassignedOption?: boolean;
  onUsersLoaded?: (users: UserOption[]) => void;
}

export function AssignedToFilter({
  scope,
  value,
  onChange,
  showUnassignedOption = false,
  onUsersLoaded,
}: AssignedToFilterProps) {
  const [users, setUsers] = useState<UserOption[]>([]);

  useEffect(() => {
    if (!scope || scope === PermissionScope.OWN) return;
    const teamOnly = scope === PermissionScope.TEAM;
    fetchApi<UserOption[]>(API_ROUTES.USERS.NAMES(teamOnly))
      .then((data) => {
        setUsers(data);
        onUsersLoaded?.(data);
      })
      .catch(() => setUsers([]));
  }, [scope, onUsersLoaded]);

  const options = useMemo(() => {
    const userOptions = users.map((u) => ({
      value: u.id,
      label:
        u.firstName || u.lastName
          ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
          : u.email,
    }));
    if (showUnassignedOption) {
      return [{ value: UNASSIGNED_VALUE, label: 'Unassigned' }, ...userOptions];
    }
    return userOptions;
  }, [users, showUnassignedOption]);

  if (!scope || scope === PermissionScope.OWN) return null;

  return (
    <div className="w-full sm:w-[200px]">
      <MultiSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder="Assigned To"
        hidePills
      />
    </div>
  );
}
