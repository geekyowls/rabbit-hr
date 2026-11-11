'use client';

import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod/v4';
import { AlertTriangle, MessageCircle, Send } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  usePreviewWhatsappMessageMutation,
  useSendWhatsappMessageMutation,
  useWhatsappTemplatesQuery,
} from '@/hooks/queries';
import type { CandidateDetail } from '@/types/candidate.type';
import type { WhatsappTemplate } from '@/types/whatsapp.type';
import { errorMessage } from '@/components/applications/application-meta';

const NONE = 'none';

const whatsappSchema = z.object({
  templateId: z.string().min(1, 'Choose a template'),
  applicationId: z.string(),
});

type WhatsappFormData = z.infer<typeof whatsappSchema>;

export function isSendableTemplate(t: WhatsappTemplate) {
  return (
    (t.status ?? '').toUpperCase() === 'APPROVED' &&
    !t.unsupportedReason &&
    t.availableAtProvider
  );
}

export function CandidateWhatsappDialog({
  open,
  onOpenChange,
  candidate,
  defaultApplicationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: CandidateDetail;
  defaultApplicationId?: string | null;
}) {
  const { data, isLoading } = useWhatsappTemplatesQuery(open);
  const templates = (data?.templates ?? []).filter(isSendableTemplate);
  const preview = usePreviewWhatsappMessageMutation();
  const send = useSendWhatsappMessageMutation();
  const name = `${candidate.firstName} ${candidate.lastName}`;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WhatsappFormData>({
    resolver: zodResolver(whatsappSchema),
    defaultValues: { templateId: '', applicationId: NONE },
  });

  const { mutate: runPreview, reset: resetPreview } = preview;

  useEffect(() => {
    if (open) {
      reset({ templateId: '', applicationId: defaultApplicationId ?? NONE });
      resetPreview();
    }
  }, [open, defaultApplicationId, reset, resetPreview]);

  const [templateId, applicationId] = useWatch({
    control,
    name: ['templateId', 'applicationId'],
  });

  useEffect(() => {
    if (!open || !templateId) return;
    runPreview({
      templateId,
      candidateId: candidate.id,
      ...(applicationId !== NONE && { applicationId }),
    });
  }, [open, templateId, applicationId, candidate.id, runPreview]);

  const missing = preview.data?.missing ?? [];

  const submit = handleSubmit(async (values) => {
    try {
      const message = await send.mutateAsync({
        templateId: values.templateId,
        candidateId: candidate.id,
        ...(values.applicationId !== NONE && {
          applicationId: values.applicationId,
        }),
      });
      if (message.status === 'failed') {
        toast.error(
          'WhatsApp not sent',
          message.errorMessage ?? 'The provider rejected the message',
        );
      } else {
        toast.success(`WhatsApp sent to ${name}`);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error('Could not send WhatsApp', errorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-[#25A35A]" />
            Send WhatsApp
          </DialogTitle>
          <DialogDescription>
            {candidate.phone
              ? `To ${name} on ${candidate.phone}`
              : 'This candidate has no phone number yet'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Template</Label>
              <Controller
                name="templateId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading || templates.length === 0}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue
                        placeholder={
                          isLoading
                            ? 'Loading templates'
                            : templates.length === 0
                              ? 'No approved templates'
                              : 'Choose a template'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label || t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.templateId && (
                <p className="text-xs text-destructive">
                  {errors.templateId.message}
                </p>
              )}
            </div>
            {candidate.applications.length > 0 && (
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
                        {candidate.applications.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.jobTitle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          {!isLoading && templates.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Approved templates appear here once they are synced in Settings
            </p>
          )}

          {templateId && (
            <div className="rounded-md border border-border bg-muted/30">
              <div className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
                Preview
              </div>
              <div className="space-y-2 p-3">
                {preview.isPending ? (
                  <Skeleton className="h-16 w-full" />
                ) : preview.isError ? (
                  <p className="text-sm text-destructive">
                    {errorMessage(preview.error, 'Could not build a preview')}
                  </p>
                ) : (
                  <p className="whitespace-pre-wrap rounded-lg bg-[#DCF8C6] px-3 py-2 text-sm text-zinc-900 dark:bg-[#1F4D33] dark:text-zinc-100">
                    {preview.data?.body ?? 'This template has no text body'}
                  </p>
                )}
                {missing.length > 0 && (
                  <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Missing values: {missing.map((m) => m.label).join(', ')}
                  </p>
                )}
              </div>
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
            <Button
              type="submit"
              size="sm"
              disabled={
                isSubmitting ||
                !candidate.phone ||
                !templateId ||
                preview.isPending ||
                preview.isError ||
                missing.length > 0
              }
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
