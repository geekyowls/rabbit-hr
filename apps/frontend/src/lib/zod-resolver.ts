import { zodResolver as rhfZodResolver } from '@hookform/resolvers/zod';
import type { FieldValues, Resolver } from 'react-hook-form';
import type { $ZodType } from 'zod/v4/core';

type Zod4Schema = $ZodType<unknown, unknown>;

export function zodResolver<T extends FieldValues>(
  schema: Zod4Schema,
): Resolver<T> {
  return rhfZodResolver(schema as never) as Resolver<T>;
}
