import { z } from 'zod/v4';
import { validatePhoneForCountry } from '@boilerplate/shared';
import { strongPasswordSchema } from './helpers';

export const loginSchema = z.object({
  email: z.email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email('Please enter a valid email'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const sendOtpSchema = z.object({
  email: z.email('Please enter a valid email'),
});

export type SendOtpFormData = z.infer<typeof sendOtpSchema>;

export const verifyOtpSchema = z.object({
  email: z.email(),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must be numeric'),
});

export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;

export const signupDetailsSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().optional(),
    phoneCountryCode: z
      .string()
      .regex(/^[A-Z]{2}$/, 'Invalid country code format'),
    phone: z.string().min(1, 'Phone number is required'),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    organizationName: z.string().min(1, 'Organization name is required'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
    if (data.phone && data.phoneCountryCode) {
      const result = validatePhoneForCountry(data.phoneCountryCode, data.phone);
      if (!result.valid) {
        ctx.addIssue({
          code: 'custom',
          message: result.error || 'Invalid phone number',
          path: ['phone'],
        });
      }
    }
  });

export type SignupDetailsFormData = z.infer<typeof signupDetailsSchema>;

export const signupSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().optional(),
    email: z.email('Please enter a valid email'),
    phoneCountryCode: z
      .string()
      .regex(/^[A-Z]{2}$/, 'Invalid country code format'),
    phone: z.string().min(1, 'Phone number is required'),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    organizationName: z.string().min(1, 'Organization name is required'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
    if (data.phone && data.phoneCountryCode) {
      const result = validatePhoneForCountry(data.phoneCountryCode, data.phone);
      if (!result.valid) {
        ctx.addIssue({
          code: 'custom',
          message: result.error || 'Invalid phone number',
          path: ['phone'],
        });
      }
    }
  });

export type SignupFormData = z.infer<typeof signupSchema>;
