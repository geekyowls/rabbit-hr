'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { z } from 'zod/v4';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { toast } from '@/lib/toast';
import type { HierarchyUser } from '@/types/user.type';
import { getFullName } from '@/types/user.type';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const setManagerSchema = z.object({
  managerId: z.string().nullable(),
});

type SetManagerFormData = z.infer<typeof setManagerSchema>;

interface SetManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: HierarchyUser | null;
  onSuccess: () => void;
}

function getDescendantIds(userId: string, users: HierarchyUser[]): Set<string> {
  const descendants = new Set<string>();
  const queue = [userId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = users.filter((u) => u.managerId === current);
    for (const child of children) {
      descendants.add(child.id);
      queue.push(child.id);
    }
  }
  return descendants;
}

export function SetManagerDialog({
  open,
  onOpenChange,
  targetUser,
  onSuccess,
}: SetManagerDialogProps) {
  const [allUsers, setAllUsers] = useState<HierarchyUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsLoadingUsers(true);
    fetchApi<HierarchyUser[]>(API_ROUTES.USERS.HIERARCHY)
      .then((data) => setAllUsers(data || []))
      .catch(() => setAllUsers([]))
      .finally(() => setIsLoadingUsers(false));
  }, [open]);

  const descendantIds = targetUser
    ? getDescendantIds(targetUser.id, allUsers)
    : new Set<string>();

  const eligibleManagers = allUsers.filter(
    (u) =>
      targetUser &&
      u.id !== targetUser.id &&
      !descendantIds.has(u.id) &&
      u.status !== 'blocked',
  );

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
  } = useForm<SetManagerFormData>({
    resolver: zodResolver(setManagerSchema),
    defaultValues: { managerId: targetUser?.managerId ?? null },
  });

  useEffect(() => {
    if (targetUser) {
      reset({ managerId: targetUser.managerId ?? null });
    }
  }, [targetUser, reset]);

  const onSubmit = async (data: SetManagerFormData) => {
    if (!targetUser) return;
    try {
      await fetchApi(API_ROUTES.USERS.SET_MANAGER(targetUser.id), {
        method: 'POST',
        body: JSON.stringify({ managerId: data.managerId }),
      });
      toast.success('Manager updated');
      onOpenChange(false);
      reset();
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to set manager';
      toast.error(message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Manager</DialogTitle>
          <DialogDescription>
            Choose a manager for {targetUser ? getFullName(targetUser) : 'user'}
            .
          </DialogDescription>
        </DialogHeader>

        {isLoadingUsers ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Manager</Label>
              <Controller
                name="managerId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'none'}
                    onValueChange={(val) =>
                      field.onChange(val === 'none' ? null : val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        No Manager (Top-Level)
                      </SelectItem>
                      {eligibleManagers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {getFullName(user)} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
