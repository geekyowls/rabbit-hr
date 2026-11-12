'use client';

import { cn } from '@/lib/utils';
import { useFormatters } from '@/hooks/use-formatters';
import type {
  CustomFieldValue,
  CustomFieldValues,
} from '@/types/custom-field.type';
import type { CustomFieldLike } from './custom-field-utils';

function isEmpty(value: CustomFieldValue | undefined) {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function CustomFieldsView({
  fields,
  values,
  className,
}: {
  fields: CustomFieldLike[];
  values: CustomFieldValues | null | undefined;
  className?: string;
}) {
  const fmt = useFormatters();
  if (fields.length === 0) return null;

  const display = (field: CustomFieldLike, value: CustomFieldValue) => {
    switch (field.type) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'multiselect':
        return Array.isArray(value) ? value.join(', ') : String(value);
      case 'number':
        return typeof value === 'number' ? fmt.number(value) : String(value);
      case 'date':
        return fmt.date(String(value)) || String(value);
      case 'url':
        return (
          <a
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-primary underline-offset-2 hover:underline"
          >
            {String(value)}
          </a>
        );
      default:
        return String(value);
    }
  };

  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border p-3 text-sm',
        className,
      )}
    >
      {fields.map((field) => {
        const value = values?.[field.key];
        return (
          <div
            key={field.key}
            className={field.type === 'textarea' ? 'col-span-full' : undefined}
          >
            <dt className="text-xs text-muted-foreground">{field.label}</dt>
            <dd
              className={cn(
                'font-medium',
                field.type === 'textarea' && 'whitespace-pre-wrap font-normal',
              )}
            >
              {isEmpty(value) ? (
                <span className="font-normal text-muted-foreground">-</span>
              ) : (
                display(field, value as CustomFieldValue)
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
