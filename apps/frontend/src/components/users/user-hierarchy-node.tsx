'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { InitialsAvatar } from '@/components/ui/initials-avatar';

interface UserNodeData {
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string | null;
  status: string;
  [key: string]: unknown;
}

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  active: 'default',
  invited: 'secondary',
  blocked: 'destructive',
  inactive: 'outline',
};

function UserHierarchyNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as UserNodeData;
  const displayName =
    [nodeData.firstName, nodeData.lastName].filter(Boolean).join(' ') ||
    nodeData.email;

  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm w-[220px] dark:bg-zinc-900">
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-center gap-2">
        <InitialsAvatar name={displayName} className="h-8 w-8 text-xs" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{displayName}</div>
          <div className="flex items-center gap-1.5">
            {nodeData.role && (
              <span className="truncate text-xs text-muted-foreground">
                {nodeData.role}
              </span>
            )}
            <Badge
              variant={statusVariant[nodeData.status] || 'outline'}
              className="h-4 px-1 text-[10px]"
            >
              {nodeData.status}
            </Badge>
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary"
      />
    </div>
  );
}

export const UserHierarchyNode = memo(UserHierarchyNodeComponent);
