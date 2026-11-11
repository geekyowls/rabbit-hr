'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import {
  useEmailTemplatesQuery,
  useSendInboxMessageMutation,
} from '@/hooks/queries';
import type { Mailbox } from '@/types/mailbox.type';
import { errorMessage } from '@/components/applications/application-meta';
import { textToHtml } from './email-html';

const NONE = 'none';

const composeSchema = z.object({
  templateId: z.string(),
  applicationId: z.string(),
  subject: z.string().trim().min(1, 'Subject is required').max(500),
  body: z.string().trim().min(1, 'Message is required').max(20000),
});

type ComposeFormData = z.infer<typeof composeSchema>;

export interface ComposeApplicationOption {
  id: string;
  label: string;
}

export function MailboxComposeDialog({
  open,
  onOpenChange,
  mailbox,
  to,
  candidateId,
  clientId,
  applications = [],
  defaultApplicationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mailbox: Mailbox | null;
  to: { email: string; name: string };
  candidateId?: string;
  clientId?: string;
  applications?: ComposeApplicationOption[];
  defaultApplicationId?: string | null;
}) {
  const { hasPermission } = usePermissions();
  const canUseTemplates = hasPermission(PERMISSIONS_ENUM.EMAIL_TEMPLATE_READ);
  const { data: templates = [] } = useEmailTemplatesQuery(
    undefined,
    open && canUseTemplates,
  );
  const send = useSendInboxMessageMutation();

  const defaults: ComposeFormData = {
    templateId: NONE,
    applicationId: defaultApplicationId ?? NONE,
    subject: '',
    body: '',
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ComposeFormData>({
    resolver: zodResolver(composeSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) {
      reset({
        templateId: NONE,
        applicationId: defaultApplicationId ?? NONE,
        subject: '',
        body: '',
      });
    }
  }, [open, defaultApplicationId, reset]);

  const applyTemplate = (id: string) => {
    setValue('templateId', id);
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    setValue('subject', template.subject, { shouldValidate: true });
    setValue('body', template.body, { shouldValidate: true });
  };

  const submit = handleSubmit(async (data) => {
    try {
      const result = await send.mutateAsync({
        ...(mailbox && { mailboxId: mailbox.id }),
        to: [{ email: to.email, name: to.name }],
        subject: data.subject,
        html: textToHtml(data.body),
        ...(candidateId && { candidateId }),
        ...(clientId && { clientId }),
        ...(data.applicationId !== NONE && {
          applicationId: data.applicationId,
        }),
      });
      if (result.deliveryStatus === 'demo') {
        toast.info('Email saved', 'Demo inbox, not sent');
      } else {
        toast.success(`Email sent to ${to.email}`);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error('Could not send email', errorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#3F6650] dark:text-[#8FBFA1]" />
            New email
            {mailbox?.isDemo && (
              <span className="text-xs font-normal text-muted-foreground">
                Demo inbox, not sent
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {mailbox
              ? `From ${mailbox.emailAddress} to ${to.email}`
              : `To ${to.email}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {canUseTemplates && (
              <div className="space-y-1.5">
                <Label className="text-xs">Template</Label>
                <Controller
                  name="templateId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={applyTemplate}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>No template</SelectItem>
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
            )}
            {applications.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">About</Label>
                <Controller
                  name="applicationId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>No application</SelectItem>
                        {applications.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compose-subject" className="text-xs">
              Subject
            </Label>
            <Input
              id="compose-subject"
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
            <Label htmlFor="compose-body" className="text-xs">
              Message
            </Label>
            <Textarea id="compose-body" rows={9} {...register('body')} />
            {errors.body ? (
              <p className="text-xs text-destructive">{errors.body.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Merge fields from templates are filled in when the email is sent
              </p>
            )}
          </div>
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
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {isSubmitting ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
