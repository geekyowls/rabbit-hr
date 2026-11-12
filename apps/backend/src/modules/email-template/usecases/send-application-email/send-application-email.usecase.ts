import { Injectable, NotFoundException } from '@nestjs/common';
import { EmailTemplateRepository } from '@db/repositories';
import { CandidateEmailService } from '../../services/candidate-email.service';
import { SendApplicationEmailCommand } from './send-application-email.command';

@Injectable()
export class SendApplicationEmail {
  constructor(
    private readonly emailTemplateRepository: EmailTemplateRepository,
    private readonly candidateEmailService: CandidateEmailService,
  ) {}

  async execute(command: SendApplicationEmailCommand) {
    const { organizationId } = command;
    const context = await this.candidateEmailService.loadContext(
      command.applicationId,
      organizationId,
      command.userId,
    );

    const template = command.templateId
      ? await this.emailTemplateRepository.findOne({
          where: { id: command.templateId, organizationId },
        })
      : null;
    if (command.templateId && !template) {
      throw new NotFoundException('Email template not found');
    }

    return this.candidateEmailService.send({
      organizationId,
      userId: command.userId,
      context,
      subject: command.subject ?? template!.subject,
      body: command.body ?? template!.body,
      metadata: { templateId: template?.id ?? null },
    });
  }
}
