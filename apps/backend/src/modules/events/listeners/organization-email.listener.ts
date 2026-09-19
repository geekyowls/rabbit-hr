import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { OrganizationCreatedEvent } from '@boilerplate/core';
import {
  MailService,
  buildOrgWelcomeEmail,
  EventName,
} from '@boilerplate/core';
import { UserRepository } from '@db/repositories';

@Injectable()
export class OrganizationEmailListener {
  private readonly logger = new Logger(OrganizationEmailListener.name);

  constructor(
    private readonly mailService: MailService,
    private readonly userRepository: UserRepository,
  ) {}

  @OnEvent(EventName.ORGANIZATION_CREATED, { async: true })
  async handleOrganizationCreated(
    event: OrganizationCreatedEvent,
  ): Promise<void> {
    if (!event.adminUserId || !event.adminPassword || !event.loginLink) {
      return;
    }

    try {
      const user = await this.userRepository.findOne({
        where: { id: event.adminUserId },
        relations: { organization: true },
      });

      if (!user) {
        this.logger.warn(
          `Admin user ${event.adminUserId} not found for org welcome email`,
        );
        return;
      }

      const orgName = user.organization?.name || 'your organization';

      const email = buildOrgWelcomeEmail({
        adminName: user.firstName || user.email.split('@')[0],
        organizationName: orgName,
        email: user.email,
        password: event.adminPassword,
        loginLink: event.loginLink,
      });

      await this.mailService.sendEmail({
        to: user.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });

      this.logger.log(
        `Organization welcome email sent to ${user.email} for org ${orgName}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send org welcome email for user ${event.adminUserId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
