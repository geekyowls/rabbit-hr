import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { validatePhoneForCountry } from '@boilerplate/core';

export function IsValidPhone(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'isValidPhone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'string' || !value) {
            return false;
          }

          const obj = args.object as Record<string, unknown>;
          const countryCode = obj.countryCode as string;

          if (!countryCode) {
            return true;
          }

          const result = validatePhoneForCountry(countryCode, value);
          return result.valid;
        },
        defaultMessage(args: ValidationArguments) {
          const obj = args.object as Record<string, unknown>;
          const countryCode = obj.countryCode as string;
          const value = args.value as string;

          if (!countryCode || typeof value !== 'string') {
            return 'Invalid phone number';
          }

          const result = validatePhoneForCountry(countryCode, value);
          return result.error || 'Invalid phone number';
        },
      },
    });
  };
}
