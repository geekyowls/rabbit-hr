export interface WhatsappCredentials {
  apiKey?: string;
  authToken?: string;
  authId?: string;
  phoneNumber?: string;
}

export interface ProviderTemplate {
  name: string;
  language: string;
  category: string | null;
  status: string | null;
  body: string | null;
  variableKeys: string[];
  unsupportedReason: string | null;
}

const VARIABLE = /\{\{\s*(\d+)\s*\}\}/g;

export function variableNumbers(text: string | null | undefined): string[] {
  if (!text) return [];
  const found = new Set<string>();
  for (const match of text.matchAll(VARIABLE)) found.add(match[1]);
  return [...found].sort((a, b) => Number(a) - Number(b));
}

export interface TemplateMessage {
  to: string;
  template: { name: string; language: string };
  variables: Record<string, string>;
  ref: string;
}

export type SendErrorCategory =
  | 'invalid_number'
  | 'template_not_approved'
  | 'rate_limited'
  | 'auth_failed'
  | 'provider_down'
  | 'unknown';

export type SendResult =
  | { ok: true; providerMessageId: string | null }
  | { ok: false; category: SendErrorCategory; message: string };

export const RETRYABLE_ERRORS: SendErrorCategory[] = [
  'rate_limited',
  'provider_down',
];

export interface WhatsappProvider {
  readonly id: string;
  readonly sendsLanguage: boolean;
  listTemplates(creds: WhatsappCredentials): Promise<ProviderTemplate[]>;
  sendTemplate(
    creds: WhatsappCredentials,
    msg: TemplateMessage,
  ): Promise<SendResult>;
}

export class WhatsappProviderError extends Error {
  constructor(
    readonly category: SendErrorCategory,
    message: string,
  ) {
    super(message);
  }
}
