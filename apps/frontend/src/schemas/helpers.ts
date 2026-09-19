import { z } from 'zod/v4';

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';

export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(PASSWORD_REGEX, PASSWORD_COMPLEXITY_MESSAGE);

export const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return typeof val === 'number' && Number.isNaN(val) ? undefined : val;
  }, schema.optional());

export const requiredNumber = (schema: z.ZodNumber, message: string) =>
  z
    .preprocess((val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return Number.isNaN(parsed) ? undefined : parsed;
      }
      return typeof val === 'number' && Number.isNaN(val) ? undefined : val;
    }, schema)
    .or(z.undefined())
    .refine((val) => typeof val === 'number', { message });
