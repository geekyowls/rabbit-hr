import { JWTPayload } from '@/types/user.type';

export function getUserFromToken(token: string): JWTPayload | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload || isTokenExpired(payload)) return null;
  return payload;
}

function isTokenExpired(payload: JWTPayload): boolean {
  if (!payload.exp) return false;
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= payload.exp;
}

function decodeJwt(token: string): JWTPayload | null {
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;

    const jsonStr =
      typeof atob === 'function'
        ? atob(base64Payload)
        : Buffer.from(base64Payload, 'base64').toString('utf8');

    return JSON.parse(jsonStr) as JWTPayload;
  } catch {
    return null;
  }
}
