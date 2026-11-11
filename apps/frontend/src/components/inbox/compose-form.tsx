'use client';

import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod/v4';
import { Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import {
  useCandidateQuery,
  useEmailTemplatesQuery,
  useSendInboxMessageMutation,
} from '@/hooks/queries';
import { Button } from '@/components/ui/button';
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

const lineInput =
  'h-9 w-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground';

function Line({
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
    <div className="border-b border-border">
      <div className="flex items-center gap-2">
        <label
          htmlFor={htmlFor}
          className="shrink-0 text-sm text-muted-foreground"
        >
          {label}
        </label>
        {children}
      </div>
      {error && <p className="pb-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function ComposeForm({
  mode,
  mailboxes,
  defaultMailboxId,
  onDone,
  className,
}: {
  mode: ComposeMode;
  mailboxes: Mailbox[];
  defaultMailboxId: string | null;
  onDone: () => void;
  className?: string;
}) {
  const send = useSendInboxMessageMutation();
  const { data: templates = [] } = useEmailTemplatesQuery();
  const usable = mailboxes.filter((m) => m.status === 'connected');
  const isReply = mode.kind === 'reply';
  const [defaults] = useState(() =>
    initialValues(mode, usable, defaultMailboxId),
  );
  const [showCopies, setShowCopies] = useState(!!defaults.cc);
  const idPrefix = isReply ? 'reply' : 'compose';

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ComposeValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const [candidateId, templateId, mailboxId] = useWatch({
    control,
    name: ['candidateId', 'templateId', 'mailboxId'],
  });
  const { data: candidate } = useCandidateQuery(candidateId || null);
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
      toast.success(
        result.deliveryStatus === 'demo'
          ? 'Saved as demo, not sent'
          : 'Email sent',
      );
      onDone();
    } catch (err) {
      toast.error('Could not send email', errorMessage(err));
    }
  });

  return (
    <form className={cn('flex min-h-0 flex-col', className)} onSubmit={submit}>
      <div className="shrink-0 px-4">
        {usable.length > 1 && !isReply && (
          <Line label="From" error={errors.mailboxId?.message}>
            <Controller
              name="mailboxId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9 flex-1 border-0 px-0 shadow-none focus:ring-0">
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
          </Line>
        )}
        <Line label="To" htmlFor={`${idPrefix}-to`} error={errors.to?.message}>
          <input
            id={`${idPrefix}-to`}
            className={lineInput}
            autoFocus={!isReply}
            {...register('to')}
          />
          {!showCopies && (
            <button
              type="button"
              className="shrink-0 text-sm text-muted-foreground hover:text-foreground hover:underline"
              onClick={() => setShowCopies(true)}
            >
              Cc Bcc
            </button>
          )}
        </Line>
        {showCopies && (
          <>
            <Line
              label="Cc"
              htmlFor={`${idPrefix}-cc`}
              error={errors.cc?.message}
            >
              <input
                id={`${idPrefix}-cc`}
                className={lineInput}
                {...register('cc')}
              />
            </Line>
            <Line
              label="Bcc"
              htmlFor={`${idPrefix}-bcc`}
              error={errors.bcc?.message}
            >
              <input
                id={`${idPrefix}-bcc`}
                className={lineInput}
                {...register('bcc')}
              />
            </Line>
          </>
        )}
        {!isReply && (
          <Line
            label="Subject"
            htmlFor={`${idPrefix}-subject`}
            error={errors.subject?.message}
          >
            <input
              id={`${idPrefix}-subject`}
              className={lineInput}
              {...register('subject')}
            />
          </Line>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-2">
        <textarea
          aria-label="Message"
          autoFocus={isReply}
          className={cn(
            'w-full flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground',
            isReply ? 'min-h-32' : 'min-h-48',
          )}
          {...register('body')}
        />
        {errors.body?.message && (
          <p className="text-xs text-destructive">{errors.body.message}</p>
        )}
        {(templateId !== NO_TEMPLATE || candidateId) && (
          <p className="pt-1 text-xs text-muted-foreground">
            Merge fields like {'{{candidate.firstName}}'} are filled in when the
            email is sent
          </p>
        )}
      </div>

      {!isReply && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 px-4 pb-2">
          {candidate && candidateId ? (
            <span className="inline-flex h-7 min-w-0 items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 text-xs">
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
          <Controller
            name="applicationId"
            control={control}
            render={({ field }) => (
              <div className="flex min-w-0 flex-1 items-center gap-1">
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
                    className="h-8 w-8 shrink-0"
                    aria-label="Remove application"
                    onClick={() => field.onChange('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          />
        </div>
      )}

      <div className="flex shrink-0 items-center gap-2 border-t border-border px-4 py-2.5">
        <Button
          type="submit"
          size="sm"
          className="rounded-full px-5"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending' : 'Send'}
        </Button>
        <Select value={templateId} onValueChange={applyTemplate}>
          <SelectTrigger className="h-8 w-auto max-w-48 gap-1.5 rounded-full text-xs">
            <SelectValue placeholder="Template" />
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
        {isDemo && (
          <span className="hidden truncate text-xs text-muted-foreground sm:inline">
            Demo inbox, not sent
          </span>
        )}
        <button
          type="button"
          aria-label="Discard"
          title="Discard"
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={onDone}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
