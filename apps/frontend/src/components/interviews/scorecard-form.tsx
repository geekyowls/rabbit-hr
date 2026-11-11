'use client';

import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@/lib/zod-resolver';
import { RatingStars, SegmentedControl } from '@/components/patterns';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import {
  RECOMMENDATIONS,
  SCORECARD_CRITERIA,
  type Rating,
  type Recommendation,
} from './interview-data';

const schema = z.object({
  ratings: z.array(z.number().min(1, 'Rate every criterion').max(5)),
  recommendation: z
    .string()
    .refine(
      (v) => (RECOMMENDATIONS as string[]).includes(v),
      'Pick a recommendation',
    ),
  notes: z.string().min(1, 'Add a short summary'),
});

type ScorecardValues = z.infer<typeof schema>;

export interface ScorecardSubmission {
  ratings: Rating[];
  recommendation: Recommendation;
  notes: string;
}

export function ScorecardForm({
  interviewer,
  onSubmit,
  onCancel,
}: {
  interviewer: string;
  onSubmit: (submission: ScorecardSubmission) => void;
  onCancel: () => void;
}) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ScorecardValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ratings: SCORECARD_CRITERIA.map(() => 0),
      recommendation: '',
      notes: '',
    },
  });

  const submit = handleSubmit(async (values) => {
    await new Promise((r) => setTimeout(r, 300));
    onSubmit({
      ratings: SCORECARD_CRITERIA.map((label, i) => ({
        label,
        rating: values.ratings[i],
      })),
      recommendation: values.recommendation as Recommendation,
      notes: values.notes,
    });
  });

  const ratingError = errors.ratings?.find?.((e) => e)?.message;

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-md border border-border p-3"
    >
      <div className="flex items-center gap-2 text-sm">
        <InitialsAvatar name={interviewer} className="h-6 w-6 text-[10px]" />
        <span className="font-medium">{interviewer}</span>
        <span className="text-xs text-muted-foreground">
          submitting feedback
        </span>
      </div>

      <div className="space-y-2">
        {SCORECARD_CRITERIA.map((label, i) => (
          <div
            key={label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{label}</span>
            <Controller
              name={`ratings.${i}`}
              control={control}
              render={({ field }) => (
                <RatingStars
                  value={field.value}
                  onChange={field.onChange}
                  size={18}
                />
              )}
            />
          </div>
        ))}
        {ratingError && <p className="text-xs text-red-500">{ratingError}</p>}
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          Overall recommendation
        </p>
        <Controller
          name="recommendation"
          control={control}
          render={({ field }) => (
            <SegmentedControl<string>
              value={field.value}
              onChange={field.onChange}
              options={RECOMMENDATIONS.map((r) => ({ value: r, label: r }))}
            />
          )}
        />
        {errors.recommendation?.message && (
          <p className="text-xs text-red-500">
            {errors.recommendation.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Summary</p>
        <Textarea
          rows={3}
          placeholder="Key strengths, concerns and evidence from the interview"
          {...register('notes')}
        />
        {errors.notes?.message && (
          <p className="text-xs text-red-500">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting' : 'Submit scorecard'}
        </Button>
      </div>
    </form>
  );
}
