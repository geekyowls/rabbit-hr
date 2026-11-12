import * as plivo from 'plivo';
import type { Request } from 'express';

const SIGNATURE_HEADER = 'x-plivo-signature-v3';
const NONCE_HEADER = 'x-plivo-signature-v3-nonce';

type ValidateV3 = (
  method: string,
  uri: string,
  nonce: string,
  authToken: string,
  signature: string,
  params?: Record<string, unknown>,
) => boolean;

export function verifyPlivoSignature(
  req: Request,
  expectedUrl: string,
  authToken: string,
): boolean {
  const signature = headerValue(req.headers[SIGNATURE_HEADER]);
  const nonce = headerValue(req.headers[NONCE_HEADER]);
  if (!signature || !nonce) return false;

  const method = req.method.toUpperCase();
  const params =
    method === 'POST' ? ((req.body as Record<string, unknown>) ?? {}) : {};
  try {
    return (
      plivo as unknown as { validateV3Signature: ValidateV3 }
    ).validateV3Signature(
      method,
      expectedUrl,
      nonce,
      authToken,
      signature,
      params,
    );
  } catch {
    return false;
  }
}

function headerValue(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
