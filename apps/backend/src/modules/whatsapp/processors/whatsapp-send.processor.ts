import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WhatsappMessageEntity } from '@db/entities';
import {
  ActivityRepository,
  ApplicationRepository,
  WhatsappMessageRepository,
  WhatsappTemplateRepository,
} from '@db/repositories';
import { ActivityType, WhatsappMessageStatus } from '@db/enums';
import { ContextLogger } from '@shared/framework/context-logger';
import { QUEUE_NAMES } from '@modules/queue/queue.module';
import { reportJobFailure } from '@modules/queue/report-job-failure';
import { WhatsappConnectionService } from '../services/whatsapp-connection.service';
import { WhatsappSendJob } from '../services/whatsapp.service';
import { RETRYABLE_ERRORS } from '../providers/whatsapp-provider';

@Processor(QUEUE_NAMES.WHATSAPP_SEND, { concurrency: 5 })
export class WhatsappSendProcessor extends WorkerHost {
  private readonly logger = new ContextLogger(WhatsappSendProcessor.name);

  constructor(
    private readonly messages: WhatsappMessageRepository,
    private readonly templates: WhatsappTemplateRepository,
    private readonly applications: ApplicationRepository,
    private readonly activities: ActivityRepository,
    private readonly connection: WhatsappConnectionService,
  ) {
    super();
  }

  async process(job: Job<WhatsappSendJob>): Promise<void> {
    const message = await this.messages.findOne({
      where: { id: job.data.messageId },
    });
    if (!message || message.status !== WhatsappMessageStatus.QUEUED) return;

    const connection = await this.connection.find(message.organizationId);
    if (!connection || connection.provider.id !== message.provider) {
      await this.fail(message, 'auth_failed', 'WhatsApp is not connected');
      return;
    }

    const template = message.templateId
      ? await this.templates.findOne({
          where: { id: message.templateId },
          select: { id: true, language: true },
        })
      : null;

    const result = await connection.provider.sendTemplate(
      connection.credentials,
      {
        to: message.phone,
        template: {
          name: message.templateName,
          language: template?.language ?? '',
        },
        variables: message.variables,
        ref: message.id,
      },
    );

    if (result.ok) {
      message.status = WhatsappMessageStatus.SENT;
      message.providerMessageId = result.providerMessageId;
      message.sentAt = new Date();
      message.errorCategory = null;
      message.errorMessage = null;
      await this.messages.save(message);
      await this.recordActivity(message);
      return;
    }

    const attemptsLeft = (job.opts.attempts ?? 1) - job.attemptsMade - 1;
    if (RETRYABLE_ERRORS.includes(result.category) && attemptsLeft > 0) {
      throw new Error(`${result.category}: ${result.message}`);
    }
    await this.fail(message, result.category, result.message);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<WhatsappSendJob>, err: Error): Promise<void> {
    reportJobFailure(job, err);
    if (job.attemptsMade < (job.opts.attempts ?? 1)) return;
    const message = await this.messages.findOne({
      where: { id: job.data.messageId, status: WhatsappMessageStatus.QUEUED },
    });
    if (message) {
      await this.fail(message, 'unknown', err?.message ?? 'Send failed');
    }
  }

  private async fail(
    message: WhatsappMessageEntity,
    category: string,
    reason: string,
  ): Promise<void> {
    message.status = WhatsappMessageStatus.FAILED;
    message.errorCategory = category;
    message.errorMessage = reason.slice(0, 1000);
    await this.messages.save(message);
    this.logger.warn(
      `WhatsApp send failed (${category}) for message ${message.id}: ${reason}`,
    );
    await this.recordActivity(message);
  }

  private async recordActivity(message: WhatsappMessageEntity): Promise<void> {
    try {
      const application = message.applicationId
        ? await this.applications.findOne({
            where: { id: message.applicationId },
            relations: { job: true },
            select: {
              id: true,
              jobId: true,
              job: { id: true, clientId: true },
            },
          })
        : null;
      const sent = message.status === WhatsappMessageStatus.SENT;
      await this.activities.record({
        organizationId: message.organizationId,
        candidateId: message.candidateId,
        applicationId: message.applicationId,
        jobId: application?.jobId ?? null,
        clientId: application?.job?.clientId ?? null,
        type: ActivityType.WHATSAPP,
        title: sent
          ? `WhatsApp sent: ${message.templateName}`
          : `WhatsApp failed: ${message.templateName}`,
        body: message.renderedBody,
        metadata: {
          kind: 'whatsapp',
          whatsappMessageId: message.id,
          template: message.templateName,
          status: message.status,
          phone: message.phone,
          errorCategory: message.errorCategory,
          errorMessage: message.errorMessage,
        },
        actorId: message.sentBy,
      });
    } catch (err) {
      this.logger.warn(
        `WhatsApp activity log failed for message ${message.id}: ${(err as Error).message}`,
      );
    }
  }
}
