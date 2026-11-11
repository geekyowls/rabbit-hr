'use client';

import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod/v4';
import { X } from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { useResetOnKey } from '@/hooks/use-reset-on-key';
import {
  useCandidateQuery,
  useEmailTemplatesQuery,
  useSendInboxMessageMutation,
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApplicationPicker } from '@/components/interviews/application-picker';
import { errorMessage } from '@/components/applications/application-meta';
import type { Mailbox } from '@/types/mailbox.type';
import type { InboxMessage, InboxThreadDetail } from '@/types/inbox.type';
import { CandidateLinkPicker } from './candidate-link-picker';
import {
  emailListValid,
  replyRecipients,
  replySubject,
  textToHtml,
  toRecipients,
} from './inbox-utils';

export type ComposeMode =
  | { kind: 'new' }
  | {
      kind: 'reply';
      thread: InboxThreadDetail;
      message: InboxMessage;
      all: boolean;
    };

const NO_TEMPLATE = 'none';

const emailList = (required: boolean) =>
  z
    .string()
    .trim()
    .refine((v) => !required || v.length > 0, 'Add at least one recipient')
    .refine(emailListValid, 'Use valid email addresses separated by commas');

const schema = z.object({
  mailboxId: z.string().min(1, 'Choose a mailbox'),
  to: emailList(true),
  cc: emailList(false),
  bcc: emailList(false),
  subject: z.string().trim().min(1, 'Add a subject').max(500),
  body: z.string().trim().min(1, 'Write a message'),
  templateId: z.string(),
  candidateId: z.string(),
  applicationId: z.string(),
});

type ComposeValues = z.infer<typeof schema>;

function initialValues(
  mode: ComposeMode,
  mailboxes: Mailbox[],
  defaultMailboxId: string | null,
): ComposeValues {
  if (mode.kind === 'reply') {
    const own =
      mailboxes.find((m) => m.id === mode.thread.mailboxId)?.emailAddress ??
      mode.thread.mailbox?.emailAddress ??
      '';
    const { to, cc } = replyRecipients(mode.message, own, mode.all);
    return {
      mailboxId: mode.thread.mailboxId,
      to,
      cc,
      bcc: '',
      subject: replySubject(mode.thread.subject),
      body: '',
      templateId: NO_TEMPLATE,
      candidateId: mode.thread.candidate?.id ?? '',
      applicationId: mode.thread.application?.id ?? '',
    };
  }
  return {
    mailboxId: defaultMailboxId ?? mailboxes[0]?.id ?? '',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    templateId: NO_TEMPLATE,
    candidateId: '',
    applicationId: '',
  };
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={htmlFor}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function ComposeDialog({
  open,
  onOpenChange,
  mode,
  mailboxes,
  defaultMailboxId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ComposeMode;
  mailboxes: Mailbox[];
  defaultMailboxId: string | null;
}) {
  const send = useSendInboxMessageMutation();
  const { data: templates = [] } = useEmailTemplatesQuery(undefined, open);
  const [showCopies, setShowCopies] = useState(false);
  const usable = mailboxes.filter((m) => m.status === 'connected');

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ComposeValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues(mode, usable, defaultMailboxId),
  });

  const resetKey =
    mode.kind === 'reply'
      ? `reply:${mode.message.id}:${mode.all ? 'all' : 'one'}`
      : `new:${defaultMailboxId ?? ''}`;
  useResetOnKey(open ? resetKey : null, () => {
    const values = initialValues(mode, usable, defaultMailboxId);
    setShowCopies(!!values.cc);
    reset(values);
  });

  const [candidateId, templateId, mailboxId] = useWatch({
    control,
    name: ['candidateId', 'templateId', 'mailboxId'],
  });
  const { data: candidate } = useCandidateQuery(candidateId || null);
  const isReply = mode.kind === 'reply';
  const isDemo = !!usable.find((m) => m.id === mailboxId)?.isDemo;

  const applyTemplate = (id: string) => {
    setValue('templateId', id);
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    if (!isReply) setValue('subject', template.subject, { shouldDirty: true });
    setValue('body', template.body, { shouldDirty: true });
  };

  const submit = handleSubmit(async (values) => {
    try {
      const result = await send.mutateAsync({
        mailboxId: values.mailboxId,
        ...(mode.kind === 'reply' && {
          threadId: mode.thread.id,
          inReplyToMessageId: mode.message.id,
        }),
        to: toRecipients(values.to),
        ...(values.cc && { cc: toRecipients(values.cc) }),
        ...(values.bcc && { bcc: toRecipients(values.bcc) }),
        subject: values.subject,
        html: textToHtml(values.body),
        ...(values.templateId !== NO_TEMPLATE && {
          templateId: values.templateId,
        }),
        ...(values.candidateId && { candidateId: values.candidateId }),
        ...(values.applicationId && { applicationId: values.applicationId }),
      });
      if (result.deliveryStatus === 'demo') {
        toast.success('Saved as demo, not sent');
      } else {
        toast.success('Email sent');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error('Could not send email', errorMessage(err));
    }
  });

  const title = isReply ? (mode.all ? 'Reply all' : 'Reply') : 'New message';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isDemo
              ? 'Demo inbox, messages are not sent'
              : 'Sent from your connected mailbox'}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={submit}>
          {usable.length > 1 && !isReply && (
            <Field label="From" error={errors.mailboxId?.message}>
              <Controller
                name="mailboxId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Choose a mailbox" />
                    </SelectTrigger>
                    <SelectContent>
                      {usable.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.emailAddress}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          )}
          <Field label="To" htmlFor="compose-to" error={errors.to?.message}>
            <div className="flex items-center gap-2">
              <Input
                id="compose-to"
                className="h-9"
                placeholder="name@example.com"
                {...register('to')}
              />
              {!showCopies && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() => setShowCopies(true)}
                >
                  Cc and Bcc
                </Button>
              )}
            </div>
          </Field>
          {showCopies && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Cc" htmlFor="compose-cc" error={errors.cc?.message}>
                <Input id="compose-cc" className="h-9" {...register('cc')} />
              </Field>
              <Field
                label="Bcc"
                htmlFor="compose-bcc"
                error={errors.bcc?.message}
              >
                <Input id="compose-bcc" className="h-9" {...register('bcc')} />
              </Field>
            </div>
          )}
          <Field
            label="Subject"
            htmlFor="compose-subject"
            error={errors.subject?.message}
          >
            <Input
              id="compose-subject"
              className="h-9"
              {...register('subject')}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Template">
              <Select value={templateId} onValueChange={applyTemplate}>
                <SelectTrigger className="h-9">
                  <SelectValue />
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
            </Field>
            <Field label="Candidate">
              <div className="flex h-9 items-center gap-2">
                {candidate && candidateId ? (
                  <span className="inline-flex h-7 min-w-0 items-center gap-1 rounded-md border border-border bg-muted/40 px-2 text-xs">
                    <span className="truncate">
                      {candidate.firstName} {candidate.lastName}
                    </span>
                    <button
                      type="button"
                      aria-label="Remove candidate"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setValue('candidateId', '');
                        setValue('applicationId', '');
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : (
                  <CandidateLinkPicker
                    onSelect={(c) => {
                      setValue('candidateId', c.id);
                      setValue('applicationId', '');
                    }}
                  />
                )}
              </div>
            </Field>
          </div>
          <Field label="Application">
            <Controller
              name="applicationId"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <ApplicationPicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </div>
                  {field.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      aria-label="Remove application"
                      onClick={() => field.onChange('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            />
          </Field>
          <Field
            label="Message"
            htmlFor="compose-body"
            error={errors.body?.message}
          >
            <Textarea id="compose-body" rows={10} {...register('body')} />
          </Field>
          {(templateId !== NO_TEMPLATE || candidateId) && (
            <p className="text-xs text-muted-foreground">
              Merge fields like {'{{candidate.firstName}}'} are filled in when
              the email is sent
            </p>
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
              {isSubmitting ? 'Sending' : 'Send'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
