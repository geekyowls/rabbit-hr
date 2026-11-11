'use client';

import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { Braces } from 'lucide-react';
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
  useCreateEmailTemplateMutation,
  useUpdateEmailTemplateMutation,
} from '@/hooks/queries';
import {
  EMAIL_TEMPLATE_CATEGORIES,
  type EmailTemplate,
  type EmailTemplateCategory,
} from '@/types/email-template.type';
import {
  CATEGORY_LABEL,
  MERGE_FIELDS,
  mergeToken,
  renderTemplate,
  type MergeField,
} from './email-template-utils';

const templateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150),
  category: z.enum(
    EMAIL_TEMPLATE_CATEGORIES as [
      EmailTemplateCategory,
      ...EmailTemplateCategory[],
    ],
  ),
  subject: z.string().trim().min(1, 'Subject is required').max(300),
  body: z.string().trim().min(1, 'Body is required'),
  isDefault: z.boolean(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

type InsertTarget = 'subject' | 'body';

function toDefaults(
  template: EmailTemplate | null,
  category: EmailTemplateCategory,
): TemplateFormData {
  return {
    name: template?.name ?? '',
    category: template?.category ?? category,
    subject: template?.subject ?? '',
    body: template?.body ?? '',
    isDefault: template?.isDefault ?? false,
  };
}

export function EmailTemplateDialog({
  open,
  onOpenChange,
  template,
  defaultCategory = 'general',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
  defaultCategory?: EmailTemplateCategory;
}) {
  const createTemplate = useCreateEmailTemplateMutation();
  const updateTemplate = useUpdateEmailTemplateMutation();
  const subjectRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const targetRef = useRef<InsertTarget>('body');

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: toDefaults(template, defaultCategory),
  });

  useEffect(() => {
    if (open) {
      reset(toDefaults(template, defaultCategory));
      targetRef.current = 'body';
    }
  }, [open, template, defaultCategory, reset]);

  const subjectField = register('subject');
  const bodyField = register('body');
  const subject = watch('subject');
  const body = watch('body');

  const insertField = (field: MergeField) => {
    const target = targetRef.current;
    const el = target === 'subject' ? subjectRef.current : bodyRef.current;
    const current = getValues(target) ?? '';
    const token = mergeToken(field);
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    setValue(target, next, {
      shouldDirty: true,
      shouldValidate: !!errors[target],
    });
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const caret = start + token.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const onSubmit = async (values: TemplateFormData) => {
    try {
      if (template) {
        await updateTemplate.mutateAsync({ id: template.id, data: values });
        toast.success('Template updated');
      } else {
        await createTemplate.mutateAsync(values);
        toast.success('Template created');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not save template',
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit template' : 'New template'}
          </DialogTitle>
          <DialogDescription>
            Click a merge field to insert it where your cursor is
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                <div className="space-y-1.5">
                  <Label htmlFor="template-name">Name</Label>
                  <Input
                    id="template-name"
                    placeholder="Interview invite"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EMAIL_TEMPLATE_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {CATEGORY_LABEL[c]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="template-subject">Subject</Label>
                <Input
                  id="template-subject"
                  placeholder="Your interview for {{job.title}}"
                  {...subjectField}
                  ref={(el) => {
                    subjectField.ref(el);
                    subjectRef.current = el;
                  }}
                  onFocus={() => {
                    targetRef.current = 'subject';
                  }}
                />
                {errors.subject && (
                  <p className="text-sm text-destructive">
                    {errors.subject.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="template-body">Body</Label>
                <Textarea
                  id="template-body"
                  rows={10}
                  placeholder="Hi {{candidate.firstName}},"
                  {...bodyField}
                  ref={(el) => {
                    bodyField.ref(el);
                    bodyRef.current = el;
                  }}
                  onFocus={() => {
                    targetRef.current = 'body';
                  }}
                />
                {errors.body && (
                  <p className="text-sm text-destructive">
                    {errors.body.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Braces className="h-3.5 w-3.5" />
                  Merge fields
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MERGE_FIELDS.map((field) => (
                    <button
                      key={field}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertField(field)}
                      className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground hover:border-[#3F6650]/50 hover:bg-[#3F6650]/10 dark:hover:border-[#8FBFA1]/50"
                    >
                      {mergeToken(field)}
                    </button>
                  ))}
                </div>
              </div>
              <Controller
                name="isDefault"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="template-default"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label
                      htmlFor="template-default"
                      className="cursor-pointer text-sm font-normal"
                    >
                      Default for this category
                    </Label>
                  </div>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Preview with sample values
              </p>
              <div className="rounded-lg border border-border bg-background">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-xs text-muted-foreground">Subject</p>
                  <p className="break-words text-sm font-medium">
                    {subject ? (
                      renderTemplate(subject)
                    ) : (
                      <span className="text-muted-foreground">
                        No subject yet
                      </span>
                    )}
                  </p>
                </div>
                <div className="min-h-[200px] whitespace-pre-wrap break-words px-4 py-3 text-sm">
                  {body ? (
                    renderTemplate(body)
                  ) : (
                    <span className="text-muted-foreground">
                      Start typing to see a preview
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {template ? 'Save changes' : 'Create template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
