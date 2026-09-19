import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PHONE_CODES } from '@boilerplate/shared';

// Add these color arrays
const tailwindColors = {
  blue: ['#60a5fa', '#3b82f6', '#2563eb'],
  purple: ['#c084fc', '#a855f7', '#9333ea'],
  pink: ['#f472b6', '#ec4899', '#db2777'],
  indigo: ['#818cf8', '#6366f1', '#4f46e5'],
  teal: ['#2dd4bf', '#14b8a6', '#0d9488'],
  emerald: ['#34d399', '#10b981', '#059669'],
  rose: ['#fb7185', '#f43f5e', '#e11d48'],
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return 'N/A';

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return 'Invalid date';
  }
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return 'N/A';

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (error) {
    return 'Invalid date';
  }
}

export function generateAvatarColors(name: string) {
  // Use name to generate consistent color for the same name
  const colorIndex = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const colorFamilies = Object.keys(tailwindColors);
  const familyIndex = colorIndex % colorFamilies.length;
  const family = colorFamilies[familyIndex];

  const shades = tailwindColors[family as keyof typeof tailwindColors];
  const shadeIndex =
    Math.floor(colorIndex / colorFamilies.length) % shades.length;

  return {
    background: shades[shadeIndex],
    color: '#ffffff',
  };
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function getCurrencySymbol(currency: string = 'INR'): string {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  return symbols[currency] || currency;
}

export function formatCurrency(amount: number, currency: string = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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
