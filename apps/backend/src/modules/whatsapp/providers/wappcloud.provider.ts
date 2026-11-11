import { Injectable } from '@nestjs/common';
import {
  ProviderTemplate,
  SendErrorCategory,
  SendResult,
  TemplateMessage,
  WhatsappCredentials,
  WhatsappProvider,
  WhatsappProviderError,
  variableNumbers,
} from './whatsapp-provider';
import {
  wappCloudApiBase,
  wappCloudErrorMessage,
  wappCloudHeaders,
} from './wappcloud.constants';

const REQUEST_TIMEOUT_MS = 15_000;
const LIST_PAGE_SIZE = 100;
const MAX_LIST_PAGES = 20;
const DETAIL_CONCURRENCY = 5;

interface WappCloudComponent {
  type?: string;
  format?: string;
  text?: string;
  buttons?: { type?: string; text?: string; url?: string }[];
}

interface WappCloudTemplate {
  name?: string;
  status?: string;
  category?: string;
  language?: string;
  components?: WappCloudComponent[];
}

export function toProviderTemplate(t: WappCloudTemplate): ProviderTemplate {
  const components = t.components ?? [];
  const header = components.find((c) => c.type === 'HEADER');
  const body = components.find((c) => c.type === 'BODY');
  const buttons = components.find((c) => c.type === 'BUTTONS');

  const headerKeys =
    header && (header.format ?? 'TEXT') === 'TEXT'
      ? variableNumbers(header.text).map((n) => `header.${n}`)
      : [];
  const bodyKeys = variableNumbers(body?.text).map((n) => `body.${n}`);

  let unsupportedReason: string | null = null;
  if (header && header.format && header.format !== 'TEXT') {
    unsupportedReason = `Media header (${header.format.toLowerCase()}) is not supported yet`;
  } else if (
    (buttons?.buttons ?? []).some((b) => variableNumbers(b.url).length > 0)
  ) {
    unsupportedReason = 'Button variables are not supported yet';
  } else if (headerKeys.length > 1) {
    unsupportedReason = 'Only one header variable is supported';
  }

  return {
    name: t.name ?? '',
    language: t.language ?? '',
    category: t.category ?? null,
    status: t.status ?? null,
    body: body?.text ?? null,
    variableKeys: [...headerKeys, ...bodyKeys],
    unsupportedReason,
  };
}

export function toSendRequest(msg: TemplateMessage): Record<string, unknown> {
  const body: Record<string, string> = {};
  let headerText: string | undefined;
  for (const [key, value] of Object.entries(msg.variables)) {
    const [section, number] = key.split('.');
    if (section === 'body') body[number] = value;
    if (section === 'header') headerText = value;
  }
  return {
    contact_number: msg.to,
    message_uid: msg.ref,
    message: {
      template_name: msg.template.name,
      ...(headerText !== undefined
        ? { header: { type: 'text', text: headerText } }
        : {}),
      ...(Object.keys(body).length > 0 ? { body: { variables: body } } : {}),
    },
  };
}

export function categorize(status: number, message: string): SendErrorCategory {
  const text = message.toLowerCase();
  if (status === 401 || status === 403) return 'auth_failed';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'provider_down';
  if (text.includes('template')) return 'template_not_approved';
  if (text.includes('number') || text.includes('contact')) {
    return 'invalid_number';
  }
  return 'unknown';
}

@Injectable()
export class WappCloudProvider implements WhatsappProvider {
  readonly id = 'wappcloud';
  readonly sendsLanguage = false;

  async listTemplates(creds: WhatsappCredentials): Promise<ProviderTemplate[]> {
    const summaries = await this.listTemplateSummaries(creds);
    const templates: ProviderTemplate[] = [];
    for (let i = 0; i < summaries.length; i += DETAIL_CONCURRENCY) {
      const batch = await Promise.all(
        summaries
          .slice(i, i + DETAIL_CONCURRENCY)
          .map((summary) => this.templateDetails(creds, summary)),
      );
      templates.push(...batch.flat());
    }
    return templates.filter((t) => t.name);
  }

  private async listTemplateSummaries(
    creds: WhatsappCredentials,
  ): Promise<WappCloudTemplate[]> {
    const summaries: WappCloudTemplate[] = [];
    let after: string | undefined;
    for (let page = 0; page < MAX_LIST_PAGES; page++) {
      const query = new URLSearchParams({
        TemplateStatus: 'ALL',
        limit: String(LIST_PAGE_SIZE),
      });
      if (after) query.set('after', after);
      const body = (await this.getJson(
        creds,
        `/external/templates?${query.toString()}`,
      )) as {
        data?: {
          messageTemplates?: {
            templates?: WappCloudTemplate[];
            pagination?: { after?: string };
          };
        };
      } | null;
      const list = body?.data?.messageTemplates?.templates ?? [];
      summaries.push(...list);
      after = body?.data?.messageTemplates?.pagination?.after;
      if (!after || list.length < LIST_PAGE_SIZE) break;
    }
    return summaries.filter((t) => t.name);
  }

  private async templateDetails(
    creds: WhatsappCredentials,
    summary: WappCloudTemplate,
  ): Promise<ProviderTemplate[]> {
    const query = new URLSearchParams({ TemplateName: summary.name ?? '' });
    const body = (await this.getJson(
      creds,
      `/external/templates?${query.toString()}`,
    )) as { data?: { messageTemplates?: WappCloudTemplate[] } } | null;
    const details = (body?.data?.messageTemplates ?? []).filter(
      (t) => t.name === summary.name,
    );
    if (details.length === 0) return [toProviderTemplate(summary)];
    return details.map((t) =>
      toProviderTemplate({
        ...t,
        status: t.status ?? summary.status,
        category: t.category ?? summary.category,
      }),
    );
  }

  private async getJson(
    creds: WhatsappCredentials,
    path: string,
  ): Promise<unknown> {
    const response = await this.request(creds, 'GET', path);
    const body = await safeJson(response);
    if (!response.ok) {
      const message =
        wappCloudErrorMessage(body) ?? `WappCloud returned ${response.status}`;
      throw new WhatsappProviderError(
        categorize(response.status, message),
        response.status >= 500
          ? `WappCloud could not load your templates (${message}). Add the template manually, or try again later.`
          : message,
      );
    }
    return body;
  }

  async sendTemplate(
    creds: WhatsappCredentials,
    msg: TemplateMessage,
  ): Promise<SendResult> {
    let response: Response;
    try {
      response = await this.request(
        creds,
        'POST',
        '/external/process',
        toSendRequest(msg),
      );
    } catch (err) {
      if (err instanceof WhatsappProviderError) {
        return { ok: false, category: err.category, message: err.message };
      }
      return {
        ok: false,
        category: 'provider_down',
        message: err instanceof Error ? err.message : 'WappCloud unreachable',
      };
    }
    const body = (await safeJson(response)) as {
      success?: boolean;
      data?: { message_uid?: string };
    } | null;
    if (response.ok && body?.success !== false) {
      return { ok: true, providerMessageId: body?.data?.message_uid ?? null };
    }
    const message =
      wappCloudErrorMessage(body) ?? `WappCloud returned ${response.status}`;
    return {
      ok: false,
      category: categorize(response.status, message),
      message,
    };
  }

  private request(
    creds: WhatsappCredentials,
    method: 'GET' | 'POST',
    path: string,
    payload?: unknown,
  ): Promise<Response> {
    if (!creds.apiKey || !creds.authToken) {
      throw new WhatsappProviderError(
        'auth_failed',
        'WappCloud credentials are missing',
      );
    }
    return fetch(`${wappCloudApiBase()}${path}`, {
      method,
      headers: wappCloudHeaders(creds.apiKey, creds.authToken),
      body: payload === undefined ? undefined : JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  }
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
