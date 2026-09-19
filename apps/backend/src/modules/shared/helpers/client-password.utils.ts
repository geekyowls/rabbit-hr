import { randomInt } from 'crypto';

const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRandomClientPassword(length = 10): string {
  let password = '';
  for (let i = 0; i < length; i++) {
    password += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return password;
}
