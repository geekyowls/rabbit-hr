'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { getPhonePlaceholder, formatPhoneAsYouType } from '@boilerplate/shared';

interface PhoneInputProps {
  countryCode: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  id?: string;
}

export function PhoneInput({
  countryCode,
  value,
  onChange,
  onBlur,
  disabled,
  id,
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = React.useState(() =>
    formatPhoneAsYouType(value || '', countryCode),
  );

  const prevCountryRef = React.useRef(countryCode);

  React.useEffect(() => {
    if (prevCountryRef.current !== countryCode) {
      prevCountryRef.current = countryCode;
      setDisplayValue(formatPhoneAsYouType(value || '', countryCode));
    }
  }, [countryCode, value]);

  React.useEffect(() => {
    if (!value) {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const formatted = formatPhoneAsYouType(raw, countryCode);
    setDisplayValue(formatted);
    onChange(raw);
  };

  return (
    <Input
      id={id}
      value={displayValue}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={getPhonePlaceholder(countryCode)}
    />
  );
}
