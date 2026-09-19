'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { toast } from '@/lib/toast';
import type { HierarchyUser } from '@/types/user.type';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { getLayoutedElements } from './user-hierarchy-layout';
import { UserHierarchyNode } from './user-hierarchy-node';
import { SetManagerDialog } from './set-manager-dialog';
import { Skeleton } from '@/components/ui/skeleton';

const nodeTypes = { userNode: UserHierarchyNode };

function buildFlowElements(users: HierarchyUser[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = users.map((user) => ({
    id: user.id,
    type: 'userNode',
    position: { x: 0, y: 0 },
    data: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role?.name ?? null,
      status: user.status,
    },
  }));

  const edges: Edge[] = users
    .filter((user) => user.managerId)
    .map((user) => ({
      id: `${user.managerId}-${user.id}`,
      source: user.managerId!,
      target: user.id,
      animated: false,
    }));

  return getLayoutedElements(nodes, edges);
}

export function UserHierarchy() {
  const [users, setUsers] = useState<HierarchyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [managerTarget, setManagerTarget] = useState<HierarchyUser | null>(
    null,
  );
  const { hasPermission } = usePermissions();
  const canManageTeam = hasPermission(PERMISSIONS_ENUM.TEAM_MANAGE);
  const { resolvedTheme } = useTheme();

  const loadHierarchy = useCallback(async () => {
    try {
      const data = await fetchApi<HierarchyUser[]>(API_ROUTES.USERS.HIERARCHY);
      setUsers(data || []);
      const { nodes: layoutedNodes, edges: layoutedEdges } = buildFlowElements(
        data || [],
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load hierarchy';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    loadHierarchy();
  }, [loadHierarchy]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!canManageTeam) return;
      const user = users.find((u) => u.id === node.id);
      if (user) setManagerTarget(user);
    },
    [users, canManageTeam],
  );

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 0.8 }), []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex h-[500px] items-center justify-center text-muted-foreground">
        No users found
      </div>
    );
  }

  return (
    <div className="h-[600px] rounded-lg border bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        defaultViewport={defaultViewport}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
      >
        <Controls />
        <MiniMap zoomable pannable className="!bg-muted" />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      <SetManagerDialog
        open={!!managerTarget}
        onOpenChange={(open) => !open && setManagerTarget(null)}
        targetUser={managerTarget}
        onSuccess={loadHierarchy}
      />
    </div>
  );
}
