import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MoreThan } from 'typeorm';
import { WhatsappMessageEntity, WhatsappTemplateEntity } from '@db/entities';
import {
  ApplicationRepository,
  CandidateRepository,
  WhatsappMessageRepository,
  WhatsappTemplateRepository,
} from '@db/repositories';
import { WhatsappMessageStatus } from '@db/enums';
import { QUEUE_NAMES } from '@modules/queue/queue.module';
import { toE164 } from '@shared/helpers/integration-credentials';
import { WhatsappConnectionService } from './whatsapp-connection.service';
import {
  PLACEHOLDERS,
  PlaceholderContext,
  PlaceholderService,
} from './placeholder.service';
import {
  ProviderTemplate,
  WhatsappProviderError,
} from '../providers/whatsapp-provider';

export interface WhatsappSendJob {
  messageId: string;
}

export interface WhatsappMessageInput {
  organizationId: string;
  templateId: string;
  candidateId: string;
  applicationId?: string | null;
  senderId: string;
}

export interface RenderedTemplate {
  variables: Record<string, string>;
  missing: { key: string; label: string }[];
  body: string | null;
}

const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
const PLACEHOLDER_LABELS = new Map(PLACEHOLDERS.map((p) => [p.key, p.label]));

@Injectable()
export class WhatsappService {
  constructor(
    private readonly templates: WhatsappTemplateRepository,
    private readonly messages: WhatsappMessageRepository,
    private readonly candidates: CandidateRepository,
    private readonly applications: ApplicationRepository,
    private readonly connection: WhatsappConnectionService,
    private readonly placeholders: PlaceholderService,
    @InjectQueue(QUEUE_NAMES.WHATSAPP_SEND)
    private readonly queue: Queue<WhatsappSendJob>,
  ) {}

  async syncTemplates(
    organizationId: string,
  ): Promise<WhatsappTemplateEntity[]> {
    const { provider, credentials } =
      await this.connection.require(organizationId);
    let remote: ProviderTemplate[];
    try {
      remote = await provider.listTemplates(credentials);
    } catch (err) {
      throw new BadRequestException(
        err instanceof WhatsappProviderError
          ? err.message
          : 'Could not load templates from the provider',
      );
    }

    const existing = await this.templates.find({
      where: { organizationId, provider: provider.id },
    });
    const byKey = new Map(existing.map((t) => [`${t.name}|${t.language}`, t]));
    const manualByName = new Map(
      existing.filter((t) => t.addedManually).map((t) => [t.name, t]),
    );
    const now = new Date();
    const seen = new Set<string>();

    for (const t of remote) {
      const key = `${t.name}|${t.language}`;
      seen.add(key);
      const manual = byKey.has(key) ? undefined : manualByName.get(t.name);
      if (manual) {
        manualByName.delete(t.name);
        manual.language = t.language;
      }
      const row =
        byKey.get(key) ??
        manual ??
        this.templates.create({
          organizationId,
          provider: provider.id,
          name: t.name,
          language: t.language,
          mapping: {},
        });
      row.category = t.category;
      row.status = t.status;
      row.body = t.body;
      row.variableKeys = t.variableKeys;
      row.unsupportedReason = t.unsupportedReason;
      row.availableAtProvider = true;
      row.addedManually = false;
      row.lastSyncedAt = now;
      row.mapping = Object.fromEntries(
        Object.entries(row.mapping ?? {}).filter(([k]) =>
          t.variableKeys.includes(k),
        ),
      );
      await this.templates.save(row);
    }

    for (const row of existing) {
      if (
        !seen.has(`${row.name}|${row.language}`) &&
        row.availableAtProvider &&
        !row.addedManually
      ) {
        row.availableAtProvider = false;
        row.lastSyncedAt = now;
        await this.templates.save(row);
      }
    }

    return this.listTemplates(organizationId, provider.id);
  }

  listTemplates(
    organizationId: string,
    provider?: string,
  ): Promise<WhatsappTemplateEntity[]> {
    return this.templates.find({
      where: { organizationId, ...(provider && { provider }) },
      order: { name: 'ASC', language: 'ASC' },
    });
  }

  async loadTemplate(
    organizationId: string,
    templateId: string,
  ): Promise<WhatsappTemplateEntity> {
    const template = await this.templates.findOne({
      where: { id: templateId, organizationId },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async render(
    template: WhatsappTemplateEntity,
    ctx: PlaceholderContext,
  ): Promise<RenderedTemplate> {
    const placeholderKeys = template.variableKeys
      .map((k) => template.mapping[k])
      .filter((m) => m?.type === 'placeholder')
      .map((m) => (m as { key: string }).key);
    const values = await this.placeholders.resolve(ctx, placeholderKeys);

    const variables: Record<string, string> = {};
    const missing: RenderedTemplate['missing'] = [];
    for (const key of template.variableKeys) {
      const source = template.mapping[key];
      let value: string | null = null;
      if (source?.type === 'text') value = source.value.trim() || null;
      if (source?.type === 'placeholder') value = values[source.key] ?? null;
      if (value === null) {
        missing.push({
          key,
          label:
            source?.type === 'placeholder'
              ? (PLACEHOLDER_LABELS.get(source.key) ?? source.key)
              : `Variable ${key} is not mapped`,
        });
      } else {
        variables[key] = value;
      }
    }

    const body = template.body
      ? template.body.replace(
          /\{\{\s*(\d+)\s*\}\}/g,
          (match, n: string) => variables[`body.${n}`] ?? match,
        )
      : null;
    return { variables, missing, body };
  }

  async preview(
    input: WhatsappMessageInput,
  ): Promise<RenderedTemplate & { phone: string | null }> {
    const template = await this.loadTemplate(
      input.organizationId,
      input.templateId,
    );
    const phone = await this.recipientPhone(input);
    const rendered = await this.render(template, this.context(input));
    return { ...rendered, phone };
  }

  async send(input: WhatsappMessageInput): Promise<WhatsappMessageEntity> {
    const { provider } = await this.connection.require(input.organizationId);
    const template = await this.loadTemplate(
      input.organizationId,
      input.templateId,
    );
    if (template.provider !== provider.id) {
      throw new BadRequestException(
        'This template belongs to a different WhatsApp provider, sync templates again',
      );
    }
    this.assertSendable(template);
    if (!provider.sendsLanguage) await this.assertUnambiguousName(template);

    const phone = await this.recipientPhone(input);
    if (!phone) {
      throw new BadRequestException('Candidate has no phone number');
    }

    const rendered = await this.render(template, this.context(input));
    if (rendered.missing.length > 0) {
      throw new BadRequestException(
        `Missing values: ${rendered.missing.map((m) => m.label).join(', ')}`,
      );
    }

    const dedupeKey = `manual:${template.id}:${input.candidateId}:${input.applicationId ?? ''}`;
    const duplicate = await this.messages.exists({
      where: {
        organizationId: input.organizationId,
        dedupeKey,
        status: WhatsappMessageStatus.SENT,
        createdAt: MoreThan(new Date(Date.now() - DEDUPE_WINDOW_MS)),
      },
    });
    const queued = await this.messages.exists({
      where: {
        organizationId: input.organizationId,
        dedupeKey,
        status: WhatsappMessageStatus.QUEUED,
      },
    });
    if (duplicate || queued) {
      throw new ConflictException(
        'The same message was sent to this candidate a moment ago',
      );
    }

    const message = await this.messages.save(
      this.messages.create({
        organizationId: input.organizationId,
        provider: provider.id,
        templateId: template.id,
        templateName: template.name,
        candidateId: input.candidateId,
        applicationId: input.applicationId ?? null,
        phone,
        variables: rendered.variables,
        renderedBody: rendered.body,
        status: WhatsappMessageStatus.QUEUED,
        dedupeKey,
        sentBy: input.senderId,
      }),
    );

    await this.queue.add(
      'send',
      { messageId: message.id },
      {
        jobId: message.id,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: true,
        removeOnFail: { count: 500 },
      },
    );
    return message;
  }

  private assertSendable(template: WhatsappTemplateEntity): void {
    if (!template.availableAtProvider) {
      throw new BadRequestException(
        'This template no longer exists at the provider',
      );
    }
    if ((template.status ?? '').toUpperCase() !== 'APPROVED') {
      throw new BadRequestException(
        `Template is not approved (status: ${template.status ?? 'unknown'})`,
      );
    }
    if (template.unsupportedReason) {
      throw new BadRequestException(template.unsupportedReason);
    }
  }

  private async assertUnambiguousName(
    template: WhatsappTemplateEntity,
  ): Promise<void> {
    const sameName = await this.templates.count({
      where: {
        organizationId: template.organizationId,
        provider: template.provider,
        name: template.name,
        availableAtProvider: true,
      },
    });
    if (sameName > 1) {
      throw new BadRequestException(
        `"${template.name}" exists in more than one language and this provider sends by name only`,
      );
    }
  }

  private async recipientPhone(
    input: WhatsappMessageInput,
  ): Promise<string | null> {
    const candidate = await this.candidates.findOne({
      where: { id: input.candidateId, organizationId: input.organizationId },
      select: ['id', 'phone'],
    });
    if (!candidate) throw new NotFoundException('Candidate not found');
    if (input.applicationId) {
      const application = await this.applications.exists({
        where: {
          id: input.applicationId,
          organizationId: input.organizationId,
          candidateId: input.candidateId,
        },
      });
      if (!application) {
        throw new NotFoundException('Application not found for candidate');
      }
    }
    return toE164(candidate.phone);
  }

  private context(input: WhatsappMessageInput): PlaceholderContext {
    return {
      organizationId: input.organizationId,
      candidateId: input.candidateId,
      applicationId: input.applicationId ?? null,
      senderId: input.senderId,
    };
  }
}
