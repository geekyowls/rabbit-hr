'use client';

import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
} from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DAY_NAMES,
  DAY_ORDER,
  DEFAULT_INTERVAL,
  TIME_OPTIONS,
  type AvailabilityFormValues,
} from './availability-utils';

interface EditorProps {
  control: Control<AvailabilityFormValues>;
  errors: FieldErrors<AvailabilityFormValues>;
}

function TimeSelect({
  value,
  onChange,
  invalid,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className={cn('h-9 w-[118px]', invalid && 'border-destructive')}
      >
        <SelectValue placeholder="Time" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {TIME_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function nextInterval(last?: { start: string; end: string }) {
  if (!last) return DEFAULT_INTERVAL;
  const [h, m] = last.end.split(':').map(Number);
  const startHour = Math.min(h + 1, 22);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    start: `${pad(startHour)}:${pad(m)}`,
    end: `${pad(Math.min(startHour + 1, 23))}:${pad(m)}`,
  };
}

function DayRow({ day, control, errors }: EditorProps & { day: number }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `days.${day}.intervals`,
  });
  const enabled = useWatch({ control, name: `days.${day}.enabled` });
  const intervals = useWatch({ control, name: `days.${day}.intervals` });
  const dayErrors = errors.days?.[day]?.intervals;

  return (
    <div className="flex flex-col gap-2 border-b border-border py-3 last:border-0 sm:flex-row sm:items-start">
      <div className="flex w-40 shrink-0 items-center gap-3 sm:h-9">
        <Controller
          control={control}
          name={`days.${day}.enabled`}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                if (!checked) remove();
                else if (fields.length === 0) append(DEFAULT_INTERVAL);
              }}
              aria-label={`Available on ${DAY_NAMES[day]}`}
            />
          )}
        />
        <span className="text-sm font-medium">{DAY_NAMES[day]}</span>
      </div>

      {enabled && fields.length > 0 ? (
        <div className="flex flex-1 flex-col gap-2">
          {fields.map((item, index) => (
            <div key={item.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name={`days.${day}.intervals.${index}.start`}
                  render={({ field }) => (
                    <TimeSelect
                      label="Start time"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Controller
                  control={control}
                  name={`days.${day}.intervals.${index}.end`}
                  render={({ field }) => (
                    <TimeSelect
                      label="End time"
                      value={field.value}
                      onChange={field.onChange}
                      invalid={!!dayErrors?.[index]?.end}
                    />
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => remove(index)}
                  aria-label="Remove hours"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {dayErrors?.[index]?.end?.message && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {dayErrors[index]?.end?.message}
                </p>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit px-2 text-muted-foreground"
            onClick={() =>
              append(nextInterval(intervals?.[intervals.length - 1]))
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add hours
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground sm:leading-9">
          Unavailable
        </p>
      )}
    </div>
  );
}

export function WeeklyHoursEditor({ control, errors }: EditorProps) {
  return (
    <div>
      {DAY_ORDER.map((day) => (
        <DayRow key={day} day={day} control={control} errors={errors} />
      ))}
      {(errors.days?.message || errors.days?.root?.message) && (
        <p className="pt-2 text-xs text-red-600 dark:text-red-400">
          {errors.days?.message || errors.days?.root?.message}
        </p>
      )}
    </div>
  );
}
