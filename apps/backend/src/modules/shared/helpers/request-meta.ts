import type { Request } from 'express';

export function extractUserAgent(req: Request): string | undefined {
  const ua = req.headers['user-agent'];
  if (!ua) return undefined;
  return Array.isArray(ua) ? ua[0] : String(ua).slice(0, 500);
}

export function extractIpAddress(req: Request): string | undefined {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0)
    return fwd.split(',')[0].trim().slice(0, 64);
  if (Array.isArray(fwd) && fwd.length > 0)
    return fwd[0].split(',')[0].trim().slice(0, 64);
  if (req.ip) return String(req.ip).slice(0, 64);
  return undefined;
}
