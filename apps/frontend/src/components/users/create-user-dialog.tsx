'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { RefreshCw, Mail } from 'lucide-react';
import { createUserSchema, CreateUserFormData } from '@/schemas/user.schema';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { RoleDropdown } from '@/types/role.type';
import { apiErrorDescription } from '@/components/billing/billing-error';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) {
  const [roles, setRoles] = useState<RoleDropdown[]>([]);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  );
  const [notifyUser, setNotifyUser] = useState(false);

  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      roleId: '',
      password: '',
    },
  });

  const loadRoles = useCallback(async () => {
    try {
      const data = await fetchApi<RoleDropdown[]>(API_ROUTES.ROLES.LIST);
      setRoles(data);
    } catch {
      // roles dropdown will be empty
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadRoles();
      setGeneratedPassword(null);
      setNotifyUser(false);
    }
  }, [open, loadRoles]);

  const generateRandomPassword = () => {
    const length = 16;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    const allChars = uppercase + lowercase + numbers + special;

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    createForm.setValue('password', newPassword);
    toast.info('Password generated');
  };

  const onCreateSubmit = async (formData: CreateUserFormData) => {
    try {
      const result = await fetchApi<{
        userId: string;
        generatedPassword: string | null;
      }>(API_ROUTES.USERS.CREATE, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          roleId: formData.roleId || undefined,
          password: formData.password || undefined,
          notifyUser,
        }),
      });

      if (result.generatedPassword) {
        setGeneratedPassword(result.generatedPassword);
        toast.success('User created. Copy the generated password.');
      } else {
        toast.success('User created');
        createForm.reset();
        onOpenChange(false);
        onSuccess();
      }
    } catch (err: unknown) {
      toast.error(
        'Could not add user',
        apiErrorDescription(err, 'Failed to create user'),
      );
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      createForm.reset();
      setGeneratedPassword(null);
      setNotifyUser(false);
    }
    onOpenChange(isOpen);
  };

  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      toast.success('Password copied to clipboard');
    }
  };

  const handleDone = () => {
    createForm.reset();
    setGeneratedPassword(null);
    onOpenChange(false);
    onSuccess();
  };

  if (generatedPassword) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Created</DialogTitle>
            <DialogDescription>
              {notifyUser
                ? 'The login credentials have been sent to the user via email.'
                : 'Save the generated password. It will not be shown again.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Generated Password</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedPassword}
                  readOnly
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyPassword}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleDone}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>
            Create a new user account directly
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={createForm.handleSubmit(onCreateSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              disabled={createForm.formState.isSubmitting}
              {...createForm.register('email')}
            />
            {createForm.formState.errors.email && (
              <p className="text-sm text-red-500">
                {createForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                disabled={createForm.formState.isSubmitting}
                {...createForm.register('firstName')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                disabled={createForm.formState.isSubmitting}
                {...createForm.register('lastName')}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Controller
              name="roleId"
              control={createForm.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={createForm.formState.isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role (optional)" />
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
          <div className="space-y-2">
            <Label htmlFor="password">
              Password{' '}
              <span className="text-muted-foreground font-normal">
                (optional - will generate if blank)
              </span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type="text"
                placeholder="Leave blank to auto-generate"
                disabled={createForm.formState.isSubmitting}
                {...createForm.register('password')}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGeneratePassword}
                disabled={createForm.formState.isSubmitting}
                title="Generate password"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {createForm.formState.errors.password && (
              <p className="text-sm text-red-500">
                {createForm.formState.errors.password.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="notifyUser"
              checked={notifyUser}
              onCheckedChange={(checked) => setNotifyUser(checked === true)}
              disabled={createForm.formState.isSubmitting}
            />
            <Label
              htmlFor="notifyUser"
              className="flex items-center gap-1.5 text-sm font-normal cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Send login credentials via email
            </Label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={createForm.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createForm.formState.isSubmitting}>
              {createForm.formState.isSubmitting
                ? 'Creating...'
                : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
