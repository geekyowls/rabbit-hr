'use client';

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CustomFieldLike } from './custom-field-utils';

const CLEAR = '__clear__';

export function CustomFieldsForm<T extends FieldValues>({
  fields,
  control,
  name = 'customFields',
  className,
  labelClassName,
  inputClassName = 'h-9',
}: {
  fields: CustomFieldLike[];
  control: Control<T>;
  name?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}) {
  if (fields.length === 0) return null;
  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {fields.map((field) => (
        <Controller
          key={field.key}
          name={`${name}.${field.key}` as FieldPath<T>}
          control={control}
          render={({ field: f, fieldState }) => {
            const wide = field.type === 'textarea' || field.type === 'boolean';
            const label = `${field.label}${field.required ? ' *' : ''}`;
            const id = `cf-${field.key}`;
            return (
              <div className={cn('space-y-1.5', wide && 'col-span-full')}>
                {field.type === 'boolean' ? (
                  <label
                    htmlFor={id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Switch
                      id={id}
                      checked={f.value === true}
                      onCheckedChange={f.onChange}
                    />
                    {label}
                  </label>
                ) : (
                  <>
                    <Label
                      htmlFor={id}
                      className={cn(
                        'text-xs font-medium text-muted-foreground',
                        labelClassName,
                      )}
                    >
                      {label}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={id}
                        rows={3}
                        value={(f.value as string) ?? ''}
                        onChange={f.onChange}
                        onBlur={f.onBlur}
                      />
                    ) : field.type === 'select' ? (
                      <Select
                        value={(f.value as string) || undefined}
                        onValueChange={(v) => f.onChange(v === CLEAR ? '' : v)}
                      >
                        <SelectTrigger id={id} className={inputClassName}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {!field.required && (
                            <SelectItem value={CLEAR}>None</SelectItem>
                          )}
                          {field.options.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'multiselect' ? (
                      <MultiSelect
                        options={field.options.map((o) => ({
                          label: o,
                          value: o,
                        }))}
                        value={Array.isArray(f.value) ? f.value : []}
                        onChange={f.onChange}
                        placeholder="Select"
                      />
                    ) : (
                      <Input
                        id={id}
                        className={inputClassName}
                        type={
                          field.type === 'date'
                            ? 'date'
                            : field.type === 'url'
                              ? 'url'
                              : 'text'
                        }
                        inputMode={
                          field.type === 'number' ? 'decimal' : undefined
                        }
                        placeholder={
                          field.type === 'url' ? 'https://' : undefined
                        }
                        value={(f.value as string) ?? ''}
                        onChange={f.onChange}
                        onBlur={f.onBlur}
                      />
                    )}
                  </>
                )}
                {fieldState.error?.message && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            );
          }}
        />
      ))}
    </div>
  );
}
