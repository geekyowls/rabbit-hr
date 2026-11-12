'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateApplicationMutation, useJobsQuery } from '@/hooks/queries';
import { ApiError } from '@/utils/error-class';
import { errorMessage } from './application-meta';

const addToJobSchema = z.object({
  jobId: z.string().min(1, 'Select a job'),
});

type AddToJobFormData = z.infer<typeof addToJobSchema>;

export function usePublishedJobs(enabled: boolean) {
  return useJobsQuery({ page: 1, limit: 100, status: 'published' }, enabled);
}

export function AddToJobDialog({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  excludeJobIds = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
  excludeJobIds?: string[];
}) {
  const { data, isLoading } = usePublishedJobs(open);
  const createApplication = useCreateApplicationMutation();
  const jobs = (data?.data ?? []).filter((j) => !excludeJobIds.includes(j.id));

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddToJobFormData>({
    resolver: zodResolver(addToJobSchema),
    defaultValues: { jobId: '' },
  });

  useEffect(() => {
    if (open) reset({ jobId: '' });
  }, [open, reset]);

  const submit = handleSubmit(async ({ jobId }) => {
    try {
      await createApplication.mutateAsync({ candidateId, jobId });
      const job = jobs.find((j) => j.id === jobId);
      toast.success(`${candidateName} added to ${job?.title ?? 'job'}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError && err.statusCode === 409
          ? 'Already applied to this job'
          : 'Could not add to job',
        errorMessage(err),
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to job</DialogTitle>
          <DialogDescription>
            Creates an application for {candidateName} in the applied stage
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Published job</Label>
            <Controller
              name="jobId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue
                      placeholder={isLoading ? 'Loading jobs' : 'Select job'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.title}
                        {j.client ? `, ${j.client.name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {!isLoading && jobs.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No published jobs available
              </p>
            )}
            {errors.jobId && (
              <p className="text-xs text-destructive">{errors.jobId.message}</p>
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
              {isSubmitting ? 'Adding...' : 'Add to job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
