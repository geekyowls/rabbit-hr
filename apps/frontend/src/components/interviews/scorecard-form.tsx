'use client';

import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { Plus, X } from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { useSubmitScorecardMutation } from '@/hooks/queries';
import { RatingStars, SegmentedControl } from '@/components/patterns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { errorMessage } from '@/components/applications/application-meta';
import type {
  Scorecard,
  ScorecardRecommendation,
} from '@/types/interview.type';
import {
  DEFAULT_CRITERIA,
  RECOMMENDATIONS,
  RECOMMENDATION_LABEL,
} from './interview-data';

const schema = z.object({
  overallRating: z.number().min(1, 'Give an overall rating').max(5),
  recommendation: z
    .string()
    .refine(
      (v) => (RECOMMENDATIONS as string[]).includes(v),
      'Pick a recommendation',
    ),
  criteria: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Name the criterion').max(100),
        rating: z.number().min(1, 'Rate every criterion').max(5),
        note: z.string().max(1000),
      }),
    )
    .max(20, 'Up to 20 criteria'),
  summary: z.string().trim().max(5000),
});

type ScorecardValues = z.infer<typeof schema>;

function initialValues(existing: Scorecard | null): ScorecardValues {
  if (existing) {
    return {
      overallRating: existing.overallRating,
      recommendation: existing.recommendation,
      criteria: existing.criteria.map((c) => ({
        name: c.name,
        rating: c.rating,
        note: c.note ?? '',
      })),
      summary: existing.summary ?? '',
    };
  }
  return {
    overallRating: 0,
    recommendation: '',
    criteria: DEFAULT_CRITERIA.map((name) => ({ name, rating: 0, note: '' })),
    summary: '',
  };
}

export function ScorecardForm({
  interviewId,
  interviewerId,
  interviewerName,
  existing,
  onDone,
  onCancel,
}: {
  interviewId: string;
  interviewerId: string;
  interviewerName: string;
  existing: Scorecard | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const submitScorecard = useSubmitScorecardMutation();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ScorecardValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues(existing),
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'criteria',
  });

  const submit = handleSubmit(async (values) => {
    try {
      await submitScorecard.mutateAsync({
        id: interviewId,
        data: {
          interviewerId,
          overallRating: values.overallRating,
          recommendation: values.recommendation as ScorecardRecommendation,
          criteria: values.criteria.map((c) => ({
            name: c.name,
            rating: c.rating,
            note: c.note.trim() || null,
          })),
          summary: values.summary || null,
        },
      });
      toast.success(existing ? 'Scorecard updated' : 'Scorecard submitted');
      onDone();
    } catch (err) {
      toast.error('Could not save scorecard', errorMessage(err));
    }
  });

  const criteriaError = errors.criteria?.find?.((e) => e?.rating || e?.name);
  const criteriaMessage =
    criteriaError?.name?.message ?? criteriaError?.rating?.message;

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-md border border-border p-3"
    >
      <div className="flex items-center gap-2 text-sm">
        <InitialsAvatar
          name={interviewerName}
          className="h-6 w-6 text-[10px]"
        />
        <span className="font-medium">{interviewerName}</span>
        <span className="text-xs text-muted-foreground">
          {existing ? 'editing feedback' : 'submitting feedback'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">
          Overall rating
        </p>
        <Controller
          name="overallRating"
          control={control}
          render={({ field }) => (
            <RatingStars
              value={field.value}
              onChange={field.onChange}
              size={20}
            />
          )}
        />
      </div>
      {errors.overallRating?.message && (
        <p className="-mt-2 text-xs text-red-500">
          {errors.overallRating.message}
        </p>
      )}

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          Recommendation
        </p>
        <Controller
          name="recommendation"
          control={control}
          render={({ field }) => (
            <SegmentedControl<string>
              value={field.value}
              onChange={field.onChange}
              options={RECOMMENDATIONS.map((r) => ({
                value: r,
                label: RECOMMENDATION_LABEL[r],
              }))}
            />
          )}
        />
        {errors.recommendation?.message && (
          <p className="text-xs text-red-500">
            {errors.recommendation.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Criteria</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => append({ name: '', rating: 0, note: '' })}
          >
            <Plus className="h-3.5 w-3.5" />
            Add criterion
          </Button>
        </div>
        {fields.map((f, i) => (
          <div key={f.id} className="space-y-1.5 rounded-md bg-muted/30 p-2">
            <div className="flex items-center gap-2">
              <Input
                className="h-8 flex-1 text-sm"
                placeholder="Criterion"
                {...register(`criteria.${i}.name`)}
              />
              <Controller
                name={`criteria.${i}.rating`}
                control={control}
                render={({ field }) => (
                  <RatingStars
                    value={field.value}
                    onChange={field.onChange}
                    size={16}
                  />
                )}
              />
              <button
                type="button"
                aria-label="Remove criterion"
                onClick={() => remove(i)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <Input
              className="h-8 text-xs"
              placeholder="Note (optional)"
              {...register(`criteria.${i}.note`)}
            />
          </div>
        ))}
        {criteriaMessage && (
          <p className="text-xs text-red-500">{criteriaMessage}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Summary</p>
        <Textarea
          rows={3}
          placeholder="Key strengths, concerns and evidence from the interview"
          {...register('summary')}
        />
        {errors.summary?.message && (
          <p className="text-xs text-red-500">{errors.summary.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving'
            : existing
              ? 'Update scorecard'
              : 'Submit scorecard'}
        </Button>
      </div>
    </form>
  );
}
