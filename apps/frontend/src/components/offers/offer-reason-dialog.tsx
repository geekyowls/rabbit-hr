'use client';

import { useEffect, useMemo } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface OfferReasonDialogConfig {
  title: string;
  description: string;
  label: string;
  placeholder?: string;
  confirmLabel: string;
  required?: boolean;
  destructive?: boolean;
  maxLength: number;
  onConfirm: (reason: string | undefined) => Promise<void>;
}

export function OfferReasonDialog({
  config,
  onOpenChange,
}: {
  config: OfferReasonDialogConfig | null;
  onOpenChange: (open: boolean) => void;
}) {
  const schema = useMemo(() => {
    const max = config?.maxLength ?? 1000;
    const base = z.string().trim().max(max, `Keep it under ${max} characters`);
    return z.object({
      reason: config?.required ? base.min(3, 'Add a short reason') : base,
    });
  }, [config]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ reason: string }>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (config) reset({ reason: '' });
  }, [config, reset]);

  const submit = handleSubmit(async ({ reason }) => {
    if (!config) return;
    try {
      await config.onConfirm(reason.trim() || undefined);
      onOpenChange(false);
    } catch {
      return;
    }
  });

  return (
    <Dialog open={!!config} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{config?.title}</DialogTitle>
          <DialogDescription>{config?.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="offer-reason" className="text-xs">
              {config?.label}
              {!config?.required && (
                <span className="text-muted-foreground"> (optional)</span>
              )}
            </Label>
            <Textarea
              id="offer-reason"
              rows={3}
              placeholder={config?.placeholder}
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
              size="sm"
              variant={config?.destructive ? 'destructive' : 'default'}
              disabled={isSubmitting}
            >
              {config?.confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
