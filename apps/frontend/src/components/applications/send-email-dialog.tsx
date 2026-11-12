'use client';

import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod/v4';
import { Mail, Send } from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NotIntegratedBadge, ToolbarButton } from '@/components/patterns';
import { useSession } from '@/contexts/session-context';
import {
  useEmailTemplatesQuery,
  useJobQuery,
  useSendApplicationEmailMutation,
} from '@/hooks/queries';
import { EMAIL_MERGE_FIELDS } from '@/types/email-template.type';
import { errorMessage, personName } from './application-meta';

const NO_TEMPLATE = 'none';
const MERGE_FIELD_PATTERN = /\{\{\s*([a-zA-Z]+\.[a-zA-Z]+)\s*\}\}/g;

const emailSchema = z.object({
  templateId: z.string(),
  subject: z.string().trim().min(1, 'Subject is required').max(300),
  body: z.string().trim().min(1, 'Message is required'),
});

type EmailFormData = z.infer<typeof emailSchema>;

export interface EmailRecipient {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  jobReference: string;
  clientName: string | null;
  candidate: { firstName: string; lastName: string; email: string };
}

function render(template: string, values: Record<string, string>) {
  return template.replace(MERGE_FIELD_PATTERN, (_m, key: string) =>
    key in values ? values[key] : '',
  );
}

export function SendEmailDialog({
  open,
  onOpenChange,
  recipient,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: EmailRecipient | null;
}) {
  const { user, organization } = useSession();
  const { data: templates = [], isLoading: templatesLoading } =
    useEmailTemplatesQuery(undefined, open);
  const { data: job } = useJobQuery(open ? recipient?.jobId : null);
  const sendEmail = useSendApplicationEmailMutation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { templateId: NO_TEMPLATE, subject: '', body: '' },
  });

  useEffect(() => {
    if (open) reset({ templateId: NO_TEMPLATE, subject: '', body: '' });
  }, [open, reset]);

  const [subject, body] = useWatch({ control, name: ['subject', 'body'] });

  const values = useMemo((): Record<string, string> => {
    if (!recipient) return {};
    const c = recipient.candidate;
    const recruiterName = personName({
      firstName: user?.firstName ?? null,
      lastName: user?.lastName ?? null,
    });
    return {
      'candidate.firstName': c.firstName,
      'candidate.lastName': c.lastName,
      'candidate.fullName': `${c.firstName} ${c.lastName}`.trim(),
      'candidate.email': c.email,
      'job.title': recipient.jobTitle,
      'job.reference': recipient.jobReference,
      'job.location': job?.location ?? '',
      'client.name': recipient.clientName ?? '',
      'recruiter.name': recruiterName || (user?.email ?? ''),
      'recruiter.firstName': user?.firstName ?? '',
      'recruiter.email': user?.email ?? '',
      'organization.name': organization?.name ?? '',
    };
  }, [recipient, user, organization, job]);

  const applyTemplate = (id: string) => {
    setValue('templateId', id);
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    setValue('subject', template.subject, { shouldValidate: true });
    setValue('body', template.body, { shouldValidate: true });
  };

  const insertField = (field: string) =>
    setValue('body', `${body}{{${field}}}`, { shouldValidate: true });

  const submit = handleSubmit(async (data) => {
    if (!recipient) return;
    try {
      const result = await sendEmail.mutateAsync({
        applicationId: recipient.applicationId,
        data: {
          ...(data.templateId !== NO_TEMPLATE && {
            templateId: data.templateId,
          }),
          subject: data.subject,
          body: data.body,
        },
      });
      if (result.sent) {
        toast.success(`Email sent to ${result.to}`);
      } else {
        toast.error(
          'Email not sent',
          `${result.reason ?? 'Mail delivery is not configured'}. It was saved to the activity log`,
        );
      }
      onOpenChange(false);
    } catch (err) {
      toast.error('Could not send email', errorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#3F6650] dark:text-[#8FBFA1]" />
            Send email
          </DialogTitle>
          <DialogDescription>
            {recipient
              ? `To ${recipient.candidate.email} about ${recipient.jobTitle}`
              : 'Choose an application first'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Template</Label>
              <Controller
                name="templateId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={applyTemplate}>
                    <SelectTrigger className="h-9">
                      <SelectValue
                        placeholder={
                          templatesLoading ? 'Loading templates' : 'None'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_TEMPLATE}>No template</SelectItem>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-subject" className="text-xs">
                Subject
              </Label>
              <Input
                id="email-subject"
                className="h-9"
                {...register('subject')}
              />
              {errors.subject && (
                <p className="text-xs text-destructive">
                  {errors.subject.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-body" className="text-xs">
                Message
              </Label>
              <Textarea id="email-body" rows={9} {...register('body')} />
              {errors.body && (
                <p className="text-xs text-destructive">
                  {errors.body.message}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {EMAIL_MERGE_FIELDS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => insertField(f)}
                  className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-0 flex-col rounded-md border border-border bg-muted/30">
            <div className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
              Preview
            </div>
            <div className="space-y-2 overflow-y-auto p-3">
              <p className="text-sm font-semibold">
                {render(subject ?? '', values) || 'No subject'}
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground/90">
                {render(body ?? '', values) ||
                  'Your message preview appears here'}
              </p>
            </div>
          </div>

          <DialogFooter className="items-center md:col-span-2">
            <span className="mr-auto flex items-center gap-2">
              <ToolbarButton type="button" disabled>
                Write with AI
              </ToolbarButton>
              <NotIntegratedBadge />
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !recipient}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {isSubmitting ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
