'use client';

import { useEffect, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
import {
  useCreateCustomFieldMutation,
  useUpdateCustomFieldMutation,
} from '@/hooks/queries';
import { errorMessage } from '@/components/applications/application-meta';
import {
  CUSTOM_FIELD_TYPES,
  type CustomFieldDefinition,
  type CustomFieldEntity,
} from '@/types/custom-field.type';
import {
  CUSTOM_FIELD_TYPE_LABEL,
  OPTION_FIELD_TYPES,
  toFieldKey,
} from './custom-field-utils';

const KEY_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;

const parseOptions = (v: string) =>
  Array.from(
    new Set(
      v
        .split('\n')
        .map((o) => o.trim())
        .filter(Boolean),
    ),
  );

const schema = z
  .object({
    label: z.string().trim().min(1, 'Label is required').max(100, 'Too long'),
    key: z
      .string()
      .trim()
      .regex(KEY_PATTERN, 'Use lowercase letters, numbers and underscores'),
    type: z.enum(CUSTOM_FIELD_TYPES),
    options: z.string(),
    required: z.boolean(),
    showOnCareersForm: z.boolean(),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const options = parseOptions(v.options);
    if (OPTION_FIELD_TYPES.includes(v.type) && options.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Add at least one option',
      });
    }
    if (options.some((o) => o.length > 100)) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Keep each option under 100 characters',
      });
    }
  });

type FormValues = z.infer<typeof schema>;

function toDefaults(field: CustomFieldDefinition | null): FormValues {
  return {
    label: field?.label ?? '',
    key: field?.key ?? '',
    type: field?.type ?? 'text',
    options: field?.options.join('\n') ?? '',
    required: field?.required ?? false,
    showOnCareersForm: field?.showOnCareersForm ?? false,
    isActive: field?.isActive ?? true,
  };
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export function CustomFieldDialog({
  open,
  onOpenChange,
  entity,
  field,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: CustomFieldEntity;
  field: CustomFieldDefinition | null;
}) {
  const isEdit = !!field;
  const createField = useCreateCustomFieldMutation();
  const updateField = useUpdateCustomFieldMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(field),
  });

  const keyEdited = useRef(false);

  useEffect(() => {
    if (!open) return;
    keyEdited.current = false;
    reset(toDefaults(field));
  }, [open, field, reset]);

  const [label, type] = useWatch({ control, name: ['label', 'type'] });
  const hasOptions = OPTION_FIELD_TYPES.includes(type);

  useEffect(() => {
    if (isEdit || keyEdited.current) return;
    setValue('key', toFieldKey(label ?? ''));
  }, [label, isEdit, setValue]);

  const onSubmit = async (v: FormValues) => {
    const base = {
      label: v.label,
      type: v.type,
      options: hasOptions ? parseOptions(v.options) : [],
      required: v.required,
      isActive: v.isActive,
      showOnCareersForm: entity === 'candidate' && v.showOnCareersForm,
    };
    try {
      if (field) {
        await updateField.mutateAsync({ id: field.id, data: base });
        toast.success('Field updated');
      } else {
        await createField.mutateAsync({ ...base, entity, key: v.key });
        toast.success('Field created');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        isEdit ? 'Could not update field' : 'Could not create field',
        errorMessage(err),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit field' : 'New field'}</DialogTitle>
          <DialogDescription>
            {entity === 'candidate'
              ? 'Shown on candidate profiles and forms'
              : 'Shown on job details and forms'}
          </DialogDescription>
        </DialogHeader>
        <form
          id="custom-field-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Label" error={errors.label?.message}>
              <Input
                className="h-9"
                placeholder="Preferred shift"
                {...register('label')}
              />
            </Field>
            <Field
              label="Key"
              error={errors.key?.message}
              hint={isEdit ? 'Keys cannot change after creation' : undefined}
            >
              <Input
                className="h-9 font-mono text-xs"
                disabled={isEdit}
                {...register('key', {
                  onChange: () => {
                    keyEdited.current = true;
                  },
                })}
              />
            </Field>
          </div>
          <Field label="Type">
            <Controller
              name="type"
              control={control}
              render={({ field: f }) => (
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOM_FIELD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {CUSTOM_FIELD_TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          {hasOptions && (
            <Field
              label="Options, one per line"
              error={errors.options?.message}
            >
              <Textarea
                rows={4}
                placeholder={'Morning\nAfternoon\nNight'}
                {...register('options')}
              />
            </Field>
          )}
          <div className="space-y-2">
            <Controller
              name="required"
              control={control}
              render={({ field: f }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={f.value} onCheckedChange={f.onChange} />
                  Required
                </label>
              )}
            />
            {entity === 'candidate' && (
              <Controller
                name="showOnCareersForm"
                control={control}
                render={({ field: f }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={f.value} onCheckedChange={f.onChange} />
                    Ask on the careers application form
                  </label>
                )}
              />
            )}
            {isEdit && (
              <Controller
                name="isActive"
                control={control}
                render={({ field: f }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={f.value} onCheckedChange={f.onChange} />
                    Active
                  </label>
                )}
              />
            )}
          </div>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="custom-field-form"
            size="sm"
            disabled={isSubmitting}
          >
            {isEdit ? 'Save changes' : 'Create field'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
