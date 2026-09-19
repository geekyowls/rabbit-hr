import {
  parsePhoneNumberFromString,
  getCountryCallingCode,
  AsYouType,
} from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

import { PHONE_CODES } from '../constants/phone-codes';

export interface PhoneValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePhoneForCountry(
  countryCode: string,
  phone: string,
): PhoneValidationResult {
  if (!phone || !countryCode) {
    return {
      valid: false,
      error: 'Phone number and country code are required',
    };
  }

  const digits = phone.replace(/\D/g, '');

  if (!digits) {
    return { valid: false, error: 'Phone number must contain digits' };
  }

  const country = countryCode.toUpperCase() as CountryCode;

  let dialCode: string;
  try {
    dialCode = getCountryCallingCode(country);
  } catch {
    return { valid: false, error: 'Invalid country code' };
  }

  const phoneNumber = parsePhoneNumberFromString(digits, country);
  if (phoneNumber && phoneNumber.isValid()) {
    return { valid: true };
  }

  if (digits.startsWith(dialCode)) {
    const withoutPrefix = digits.slice(dialCode.length);
    const phoneWithoutPrefix = parsePhoneNumberFromString(
      withoutPrefix,
      country,
    );
    if (phoneWithoutPrefix && phoneWithoutPrefix.isValid()) {
      return {
        valid: false,
        error: `Phone number appears to include the country code (+${dialCode}). Please enter only the national number.`,
      };
    }
  }

  if (digits.length >= 7 && digits.length <= 15) {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'Invalid phone number for the selected country',
  };
}

export function isValidPhoneForCountry(
  countryCode: string,
  phone: string,
): boolean {
  return validatePhoneForCountry(countryCode, phone).valid;
}

export interface NormalizedPhone {
  phone: string;
  countryCode?: string;
}

export function normalizePhone(phone: string): NormalizedPhone {
  const cleaned = phone.replace(/[\s()-]/g, '');
  if (!cleaned.startsWith('+')) {
    return { phone: cleaned };
  }

  const parsed = parsePhoneNumberFromString(cleaned);
  if (parsed && parsed.isValid()) {
    return {
      phone: parsed.nationalNumber,
      countryCode: parsed.country,
    };
  }

  return { phone: cleaned };
}

export function phoneLookupCandidates(phone: string): string[] {
  const trimmed = phone.trim();
  if (!trimmed) return [];
  const cleaned = trimmed.replace(/[\s()-]/g, '');
  const candidates = new Set<string>();
  candidates.add(trimmed);
  candidates.add(cleaned);
  if (cleaned.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(cleaned);
    if (parsed) {
      if (parsed.nationalNumber) candidates.add(parsed.nationalNumber);
      candidates.add(parsed.number);
    }
  } else {
    const digits = cleaned.replace(/\D/g, '');
    if (digits) candidates.add(digits);
  }
  return Array.from(candidates).filter(Boolean);
}

export function formatPhone(
  countryCode?: string | null,
  phone?: string | null,
): string {
  if (!phone) return '';
  if (!countryCode) return phone;
  const phoneCode = PHONE_CODES[countryCode] || countryCode;
  return `${phoneCode} ${phone}`;
}

const PHONE_PLACEHOLDERS: Record<string, string> = {
  US: '(201) 555-0123',
  CA: '(201) 555-0123',
  IN: '98765 43210',
  AU: '0412 345 678',
  GB: '07400 123456',
  AE: '050 123 4567',
  SG: '8123 4567',
  DE: '0151 23456789',
  NZ: '021 123 4567',
  ZA: '071 123 4567',
  MY: '012 345 6789',
  PH: '0912 345 6789',
  PK: '0301 2345678',
  BD: '01812 345678',
  LK: '071 234 5678',
  NP: '984 1234567',
};

export function getPhonePlaceholder(countryCode: string): string {
  return PHONE_PLACEHOLDERS[countryCode.toUpperCase()] || 'Enter phone number';
}

export function formatPhoneAsYouType(
  digits: string,
  countryCode: string,
): string {
  if (!digits) return '';
  const formatter = new AsYouType(countryCode.toUpperCase() as CountryCode);
  const formatted = formatter.input(digits);
  return formatted;
}
