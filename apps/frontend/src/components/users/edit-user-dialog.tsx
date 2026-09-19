'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { editUserSchema, EditUserFormData } from '@/schemas/user.schema';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Role } from '@/types/role.type';

interface EditUserTarget {
  id: string;
  firstName: string | null;
  lastName: string | null;
  roleId: string | null;
  email: string;
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  user: EditUserTarget | null;
}

export function EditUserDialog({
  open,
  onOpenChange,
  onSuccess,
  user,
}: EditUserDialogProps) {
  const [roles, setRoles] = useState<Role[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { firstName: '', lastName: '', roleId: '' },
  });

  const loadRoles = useCallback(async () => {
    try {
      const data = await fetchApi<Role[]>(API_ROUTES.ROLES.LIST);
      setRoles(data);
    } catch {
      // roles dropdown will be empty
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadRoles();
    }
  }, [open, loadRoles]);

  useEffect(() => {
    if (user && open) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        roleId: user.roleId || '',
      });
    }
  }, [user, open, reset]);

  const onSubmit = async (formData: EditUserFormData) => {
    if (!user) return;
    try {
      await fetchApi(API_ROUTES.USERS.UPDATE(user.id), {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      toast.success('User updated');
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update user';
      toast.error(message);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update details for {user?.email}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                placeholder="John"
                disabled={isSubmitting}
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                placeholder="Doe"
                disabled={isSubmitting}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Controller
              name="roleId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
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
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
