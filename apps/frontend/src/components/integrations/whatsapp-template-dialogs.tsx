'use client';

import { useMemo } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { useResetOnKey } from '@/hooks/use-reset-on-key';
import {
  useAddWhatsappTemplateMutation,
  useUpdateWhatsappTemplateMappingMutation,
  useWhatsappPlaceholdersQuery,
} from '@/hooks/queries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  WhatsappPlaceholder,
  WhatsappTemplate,
  WhatsappVariableSource,
} from '@/types/whatsapp.type';

const TEXT_SOURCE = '__text__';
const UNMAPPED = '__none__';

export function variableLabel(key: string) {
  const [part, index] = key.split('.');
  const name = part === 'header' ? 'Header' : part === 'body' ? 'Body' : part;
  return index ? `${name} {{${index}}}` : key;
}

export function mappedCount(template: WhatsappTemplate) {
  return template.variableKeys.filter((k) => template.mapping[k]).length;
}

function sourceLabel(
  source: WhatsappVariableSource | undefined,
  placeholders: WhatsappPlaceholder[],
) {
  if (!source) return null;
  if (source.type === 'text') return source.value;
  return placeholders.find((p) => p.key === source.key)?.label ?? source.key;
}

export function renderPreview(
  body: string,
  mapping: Record<string, WhatsappVariableSource | undefined>,
  placeholders: WhatsappPlaceholder[],
) {
  return body.replace(/\{\{\s*(\d+)\s*\}\}/g, (match, index: string) => {
    const label = sourceLabel(mapping[`body.${index}`], placeholders);
    return label ? `[${label}]` : match;
  });
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
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const addSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter the template name')
    .max(255)
    .regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers and underscores'),
  language: z.string().trim().min(1, 'Enter a language code').max(20),
  headerText: z.string().trim().max(60, 'Keep the header under 60 characters'),
  body: z
    .string()
    .trim()
    .min(1, 'Paste the approved body text')
    .max(1024, 'Keep the body under 1024 characters'),
});

type AddValues = z.infer<typeof addSchema>;

const ADD_DEFAULTS: AddValues = {
  name: '',
  language: 'en',
  headerText: '',
  body: '',
};

export function AddWhatsappTemplateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const add = useAddWhatsappTemplateMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: ADD_DEFAULTS,
  });

  useResetOnKey(open ? 'open' : null, () => reset(ADD_DEFAULTS));

  const submit = handleSubmit(async (values) => {
    try {
      await add.mutateAsync({
        name: values.name,
        language: values.language,
        body: values.body,
        ...(values.headerText && { headerText: values.headerText }),
      });
      toast.success('Template added');
      onOpenChange(false);
    } catch (err) {
      toast.error(
        'Could not add template',
        err instanceof Error ? err.message : undefined,
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add template manually</DialogTitle>
            <DialogDescription>
              Use this when a template is approved but not returned by sync.
              Copy the name and text exactly as approved.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Template name" error={errors.name?.message}>
                <Input
                  className="h-9 font-mono text-sm"
                  placeholder="interview_invite"
                  {...register('name')}
                />
              </Field>
            </div>
            <Field label="Language" error={errors.language?.message}>
              <Input
                className="h-9"
                placeholder="en"
                {...register('language')}
              />
            </Field>
          </div>
          <Field
            label="Header text"
            hint="Only if the template has a text header"
            error={errors.headerText?.message}
          >
            <Input className="h-9" {...register('headerText')} />
          </Field>
          <Field
            label="Body"
            hint="Keep the variables as {{1}}, {{2}} and so on"
            error={errors.body?.message}
          >
            <Textarea rows={5} {...register('body')} />
          </Field>
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
              {isSubmitting ? 'Adding' : 'Add template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const mappingSchema = z.object({
  label: z.string().trim().max(100, 'Keep the label under 100 characters'),
  rows: z.array(
    z.object({
      variable: z.string(),
      source: z.string(),
      text: z.string().max(1024, 'Keep the text under 1024 characters'),
    }),
  ),
});

type MappingValues = z.infer<typeof mappingSchema>;

function toMappingValues(template: WhatsappTemplate): MappingValues {
  return {
    label: template.label ?? '',
    rows: template.variableKeys.map((variable) => {
      const source = template.mapping[variable];
      return {
        variable,
        source: !source
          ? UNMAPPED
          : source.type === 'text'
            ? TEXT_SOURCE
            : source.key,
        text: source?.type === 'text' ? source.value : '',
      };
    }),
  };
}

function rowToSource(
  row: MappingValues['rows'][number],
): WhatsappVariableSource | null {
  if (row.source === UNMAPPED) return null;
  if (row.source === TEXT_SOURCE) {
    const value = row.text.trim();
    return value ? { type: 'text', value } : null;
  }
  return { type: 'placeholder', key: row.source };
}

export function WhatsappMappingDialog({
  template,
  onOpenChange,
}: {
  template: WhatsappTemplate | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = !!template;
  const { data: placeholders = [] } = useWhatsappPlaceholdersQuery(open);
  const updateMapping = useUpdateWhatsappTemplateMappingMutation();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MappingValues>({
    resolver: zodResolver(mappingSchema),
    defaultValues: { label: '', rows: [] },
  });
  const { fields } = useFieldArray({ control, name: 'rows' });
  const rows = useWatch({ control, name: 'rows' });

  useResetOnKey(template ? template.id : null, () => {
    if (template) reset(toMappingValues(template));
  });

  const groups = useMemo(() => {
    const map = new Map<string, WhatsappPlaceholder[]>();
    for (const p of placeholders) {
      map.set(p.group, [...(map.get(p.group) ?? []), p]);
    }
    return [...map.entries()];
  }, [placeholders]);

  const preview = useMemo(() => {
    if (!template?.body) return null;
    const mapping: Record<string, WhatsappVariableSource | undefined> = {};
    for (const row of rows ?? []) {
      mapping[row.variable] = rowToSource(row) ?? undefined;
    }
    return renderPreview(template.body, mapping, placeholders);
  }, [template, rows, placeholders]);

  const submit = handleSubmit(async (values) => {
    if (!template) return;
    const mapping: Record<string, WhatsappVariableSource | null> = {};
    for (const row of values.rows) mapping[row.variable] = rowToSource(row);
    try {
      await updateMapping.mutateAsync({
        id: template.id,
        data: { mapping, label: values.label },
      });
      toast.success('Template mapping saved');
      onOpenChange(false);
    } catch (err) {
      toast.error(
        'Could not save mapping',
        err instanceof Error ? err.message : undefined,
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Map template variables</DialogTitle>
            <DialogDescription>
              Choose what fills each variable when a recruiter sends this
              template.
            </DialogDescription>
          </DialogHeader>
          <Field
            label="Display name"
            hint="Shown to recruiters instead of the template name"
            error={errors.label?.message}
          >
            <Input
              className="h-9"
              placeholder={template?.name}
              {...register('label')}
            />
          </Field>

          {fields.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
              This template has no variables
            </p>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[110px_1fr] items-start gap-3"
                >
                  <span className="pt-2 font-mono text-xs text-muted-foreground">
                    {variableLabel(field.variable)}
                  </span>
                  <div className="space-y-2">
                    <Controller
                      control={control}
                      name={`rows.${index}.source`}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-72">
                            <SelectItem value={UNMAPPED}>Not mapped</SelectItem>
                            <SelectItem value={TEXT_SOURCE}>
                              Fixed text
                            </SelectItem>
                            {groups.map(([group, items]) => (
                              <SelectGroup key={group}>
                                <SelectLabel>{group}</SelectLabel>
                                {items.map((p) => (
                                  <SelectItem key={p.key} value={p.key}>
                                    {p.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {rows?.[index]?.source === TEXT_SOURCE && (
                      <Input
                        className="h-9"
                        placeholder="Text sent for this variable"
                        {...register(`rows.${index}.text`)}
                      />
                    )}
                    {errors.rows?.[index]?.text?.message && (
                      <p className="text-xs text-destructive">
                        {errors.rows[index]?.text?.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {preview && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Preview
              </Label>
              <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                {preview}
              </p>
            </div>
          )}

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
              {isSubmitting ? 'Saving' : 'Save mapping'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
