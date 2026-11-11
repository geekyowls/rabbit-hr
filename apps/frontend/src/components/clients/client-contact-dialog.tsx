'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@/lib/zod-resolver';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  useCreateClientContactMutation,
  useUpdateClientContactMutation,
} from '@/hooks/queries';
import { toast } from '@/lib/toast';
import { errorMessage } from '@/components/jobs/job-utils';
import type { ClientContact } from '@/types/client.type';

const schema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(100, 'Too long'),
  lastName: z.string().trim().max(100, 'Too long'),
  email: z
    .string()
    .trim()
    .refine((v) => !v || z.email().safeParse(v).success, 'Enter a valid email'),
  phone: z.string().trim().max(40, 'Too long'),
  jobTitle: z.string().trim().max(150, 'Too long'),
  isPrimary: z.boolean(),
});

type ContactFormValues = z.infer<typeof schema>;

const DEFAULTS: ContactFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  isPrimary: false,
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export function ClientContactDialog({
  open,
  onOpenChange,
  clientId,
  contact,
  isFirst,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  contact?: ClientContact | null;
  isFirst?: boolean;
}) {
  const isEdit = !!contact;
  const createContact = useCreateClientContactMutation();
  const updateContact = useUpdateClientContactMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      contact
        ? {
            firstName: contact.firstName,
            lastName: contact.lastName ?? '',
            email: contact.email ?? '',
            phone: contact.phone ?? '',
            jobTitle: contact.jobTitle ?? '',
            isPrimary: contact.isPrimary,
          }
        : { ...DEFAULTS, isPrimary: !!isFirst },
    );
  }, [open, contact, isFirst, reset]);

  const submit = handleSubmit(async (v) => {
    const data = {
      firstName: v.firstName,
      lastName: v.lastName || null,
      email: v.email || null,
      phone: v.phone || null,
      jobTitle: v.jobTitle || null,
      isPrimary: v.isPrimary,
    };
    try {
      if (contact) {
        await updateContact.mutateAsync({
          clientId,
          contactId: contact.id,
          data,
        });
      } else {
        await createContact.mutateAsync({ clientId, data });
      }
      toast.success(
        isEdit ? 'Contact updated' : 'Contact added',
        `${v.firstName} ${v.lastName}`.trim(),
      );
      onOpenChange(false);
    } catch (e) {
      toast.error(
        isEdit ? 'Could not update contact' : 'Could not add contact',
        errorMessage(e),
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit contact' : 'Add contact'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" error={errors.firstName?.message}>
              <Input className="h-9" {...register('firstName')} />
            </Field>
            <Field label="Last name" error={errors.lastName?.message}>
              <Input className="h-9" {...register('lastName')} />
            </Field>
          </div>
          <Field label="Job title" error={errors.jobTitle?.message}>
            <Input
              className="h-9"
              placeholder="Site manager"
              {...register('jobTitle')}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" error={errors.email?.message}>
              <Input className="h-9" type="email" {...register('email')} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <Input className="h-9" {...register('phone')} />
            </Field>
          </div>
          <Controller
            name="isPrimary"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                Primary contact
              </label>
            )}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Add contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
