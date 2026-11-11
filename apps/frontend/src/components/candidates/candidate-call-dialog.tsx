'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { Phone, PhoneCall } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInitiateCallMutation } from '@/hooks/queries';
import type { CandidateDetail } from '@/types/candidate.type';
import { errorMessage } from '@/components/applications/application-meta';

const STAFF_PHONE_KEY = 'rabbithr.calls.staffPhone';
const NONE = 'none';
const PHONE = /^\+?\d{6,15}$/;

const callSchema = z.object({
  staffPhone: z
    .string()
    .trim()
    .refine(
      (v) => PHONE.test(v.replace(/[\s().-]/g, '')),
      'Enter your phone number with country code',
    ),
  applicationId: z.string(),
});

type CallFormData = z.infer<typeof callSchema>;

function readStaffPhone() {
  try {
    return localStorage.getItem(STAFF_PHONE_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveStaffPhone(phone: string) {
  try {
    localStorage.setItem(STAFF_PHONE_KEY, phone);
  } catch {
    return;
  }
}

export function CandidateCallDialog({
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
  const initiate = useInitiateCallMutation();
  const [calling, setCalling] = useState<string | null>(null);
  const name = `${candidate.firstName} ${candidate.lastName}`;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CallFormData>({
    resolver: zodResolver(callSchema),
    defaultValues: { staffPhone: '', applicationId: NONE },
  });

  useEffect(() => {
    if (!open) return;
    setCalling(null);
    reset({
      staffPhone: readStaffPhone(),
      applicationId: defaultApplicationId ?? NONE,
    });
  }, [open, defaultApplicationId, reset]);

  const submit = handleSubmit(async (data) => {
    const staffPhone = data.staffPhone.replace(/[\s().-]/g, '');
    try {
      await initiate.mutateAsync({
        candidateId: candidate.id,
        data: {
          staffPhone,
          ...(data.applicationId !== NONE && {
            applicationId: data.applicationId,
          }),
        },
      });
      saveStaffPhone(staffPhone);
      setCalling(staffPhone);
    } catch (err) {
      toast.error('Could not start the call', errorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#3F6650] dark:text-[#8FBFA1]" />
            Call {name}
          </DialogTitle>
          <DialogDescription>
            {candidate.phone
              ? `We ring your phone first, then connect you to ${candidate.phone}`
              : 'This candidate has no phone number yet'}
          </DialogDescription>
        </DialogHeader>

        {calling ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-6 text-center">
            <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-[#3F6650]/10 text-[#3F6650] dark:bg-[#8FBFA1]/15 dark:text-[#8FBFA1]">
              <PhoneCall className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Calling you now, answer to connect
              </p>
              <p className="text-xs text-muted-foreground">
                Ringing {calling}. The call and recording appear in the Calls
                tab when it ends.
              </p>
            </div>
            <DialogFooter className="w-full sm:justify-center">
              <Button size="sm" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="staff-phone" className="text-xs">
                Your phone
              </Label>
              <Input
                id="staff-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+44 7700 900123"
                className="h-9"
                {...register('staffPhone')}
              />
              {errors.staffPhone ? (
                <p className="text-xs text-destructive">
                  {errors.staffPhone.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Remembered on this device for next time
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
                disabled={isSubmitting || !candidate.phone}
              >
                <PhoneCall className="mr-1.5 h-3.5 w-3.5" />
                {isSubmitting ? 'Starting...' : 'Start call'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
