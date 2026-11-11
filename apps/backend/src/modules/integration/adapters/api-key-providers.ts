import { BadRequestException } from '@nestjs/common';
import {
  wappCloudApiBase,
  wappCloudErrorMessage,
  wappCloudHeaders,
} from '@modules/whatsapp/providers/wappcloud.constants';

export interface ApiKeyCredentials {
  apiKey?: string;
  authId?: string;
  authToken?: string;
  phoneNumber?: string;
  webhookSecret?: string;
}

export interface HealthCheckResult {
  ok: boolean;
  accountIdentifier?: string;
  errorMessage?: string;
}

export const API_KEY_PROVIDERS = [
  'openai',
  'gemini',
  'plivo',
  'razorpay',
  'wappcloud',
] as const;
export type ApiKeyProvider = (typeof API_KEY_PROVIDERS)[number];

const HEALTH_CHECK_TIMEOUT_MS = 10_000;

export function isApiKeyProvider(provider: string): provider is ApiKeyProvider {
  return (API_KEY_PROVIDERS as readonly string[]).includes(provider);
}

export function validateCredentials(
  provider: string,
  credentials: ApiKeyCredentials,
): void {
  switch (provider) {
    case 'openai':
    case 'gemini':
      if (!credentials.apiKey || credentials.apiKey.trim() === '') {
        throw new BadRequestException('apiKey is required');
      }
      return;
    case 'plivo':
      if (!credentials.authId || credentials.authId.trim() === '') {
        throw new BadRequestException('authId is required');
      }
      if (!credentials.authToken || credentials.authToken.trim() === '') {
        throw new BadRequestException('authToken is required');
      }
      if (!credentials.phoneNumber || credentials.phoneNumber.trim() === '') {
        throw new BadRequestException('phoneNumber is required');
      }
      return;
    case 'razorpay':
      if (!credentials.authId || credentials.authId.trim() === '') {
        throw new BadRequestException('Key ID is required');
      }
      if (!credentials.authToken || credentials.authToken.trim() === '') {
        throw new BadRequestException('Key Secret is required');
      }
      return;
    case 'wappcloud':
      if (!credentials.apiKey || credentials.apiKey.trim() === '') {
        throw new BadRequestException('API key is required');
      }
      if (!credentials.authToken || credentials.authToken.trim() === '') {
        throw new BadRequestException('Access token is required');
      }
      return;
    default:
      throw new BadRequestException(
        `Unsupported api-key provider: ${provider}`,
      );
  }
}

export async function runHealthCheck(
  provider: string,
  credentials: ApiKeyCredentials,
): Promise<HealthCheckResult> {
  switch (provider) {
    case 'openai':
      return checkOpenAi(credentials.apiKey!);
    case 'gemini':
      return checkGemini(credentials.apiKey!);
    case 'plivo':
      return checkPlivo(credentials.authId!, credentials.authToken!);
    case 'razorpay':
      return checkRazorpay(credentials.authId!, credentials.authToken!);
    case 'wappcloud':
      return checkWappCloud(credentials.apiKey!, credentials.authToken!);
    default:
      return {
        ok: false,
        errorMessage: `Unsupported api-key provider: ${provider}`,
      };
  }
}

async function checkOpenAi(apiKey: string): Promise<HealthCheckResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
    });

    if (response.ok) {
      return { ok: true };
    }

    const body = await safeJson(response);
    return {
      ok: false,
      errorMessage:
        body?.error?.message ||
        `OpenAI returned ${response.status} ${response.statusText}`,
    };
  } catch (err) {
    return {
      ok: false,
      errorMessage:
        err instanceof Error ? err.message : 'OpenAI request failed',
    };
  }
}

async function checkGemini(apiKey: string): Promise<HealthCheckResult> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'GET',
        signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
      },
    );

    if (response.ok) {
      return { ok: true };
    }

    const body = await safeJson(response);
    return {
      ok: false,
      errorMessage:
        body?.error?.message ||
        `Gemini returned ${response.status} ${response.statusText}`,
    };
  } catch (err) {
    return {
      ok: false,
      errorMessage:
        err instanceof Error ? err.message : 'Gemini request failed',
    };
  }
}

async function checkPlivo(
  authId: string,
  authToken: string,
): Promise<HealthCheckResult> {
  try {
    const credentials = Buffer.from(`${authId}:${authToken}`).toString(
      'base64',
    );
    const response = await fetch(
      `https://api.plivo.com/v1/Account/${encodeURIComponent(authId)}/`,
      {
        method: 'GET',
        headers: { Authorization: `Basic ${credentials}` },
        signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
      },
    );

    if (response.ok) {
      const body = await safeJson(response);
      return {
        ok: true,
        accountIdentifier: body?.name || body?.account_type || authId,
      };
    }

    const body = await safeJson(response);
    return {
      ok: false,
      errorMessage:
        body?.error ||
        `Plivo returned ${response.status} ${response.statusText}`,
    };
  } catch (err) {
    return {
      ok: false,
      errorMessage: err instanceof Error ? err.message : 'Plivo request failed',
    };
  }
}

async function checkRazorpay(
  keyId: string,
  keySecret: string,
): Promise<HealthCheckResult> {
  try {
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch(
      'https://api.razorpay.com/v1/payments?count=1',
      {
        method: 'GET',
        headers: { Authorization: `Basic ${credentials}` },
        signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
      },
    );

    if (response.ok) {
      return { ok: true, accountIdentifier: keyId };
    }

    const body = await safeJson(response);
    return {
      ok: false,
      errorMessage:
        body?.error?.description ||
        `Razorpay returned ${response.status} ${response.statusText}`,
    };
  } catch (err) {
    return {
      ok: false,
      errorMessage:
        err instanceof Error ? err.message : 'Razorpay request failed',
    };
  }
}

async function checkWappCloud(
  apiKey: string,
  accessToken: string,
): Promise<HealthCheckResult> {
  try {
    const response = await fetch(`${wappCloudApiBase()}/external/templates`, {
      method: 'GET',
      headers: wappCloudHeaders(apiKey, accessToken),
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
    });

    if (response.status !== 401 && response.status !== 403) {
      return { ok: true, accountIdentifier: 'WappCloud' };
    }

    return {
      ok: false,
      errorMessage:
        wappCloudErrorMessage(await safeJson(response)) ||
        'WappCloud rejected the API key or access token',
    };
  } catch (err) {
    return {
      ok: false,
      errorMessage:
        err instanceof Error ? err.message : 'WappCloud request failed',
    };
  }
}

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
