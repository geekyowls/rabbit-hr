'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@/lib/zod-resolver';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const QUICK_REASONS = [
  'Not enough relevant experience',
  'No right to work',
  'Salary expectations too high',
  'Position filled',
  'Candidate not responsive',
];

const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Add a short reason')
    .max(500, 'Keep it under 500 characters'),
});

type RejectFormData = z.infer<typeof rejectSchema>;

export function RejectApplicationDialog({
  open,
  onOpenChange,
  candidateName,
  count,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName?: string;
  count?: number;
  onConfirm: (reason: string) => Promise<void> | void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RejectFormData>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (open) reset({ reason: '' });
  }, [open, reset]);

  const submit = handleSubmit(async ({ reason }) => {
    try {
      await onConfirm(reason);
      onOpenChange(false);
    } catch {
      return;
    }
  });

  const subject =
    count && count > 1
      ? `${count} candidates`
      : (candidateName ?? 'this candidate');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject {subject}</DialogTitle>
          <DialogDescription>
            The reason is saved on the application and shown in its history
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setValue('reason', r, { shouldValidate: true })}
                className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {r}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason" className="text-xs">
              Reason
            </Label>
            <Textarea
              id="reject-reason"
              rows={3}
              placeholder="Why is this application being rejected?"
              {...register('reason')}
            />
            {errors.reason && (
              <p className="text-xs text-destructive">
                {errors.reason.message}
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
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
