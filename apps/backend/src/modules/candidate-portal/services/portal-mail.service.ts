import { Injectable } from '@nestjs/common';
import { MailService } from '@boilerplate/core';
import { ContextLogger } from '@shared/framework/context-logger';
import type { PortalEmail } from './portal-email.templates';

export interface PortalMailResult {
  sent: boolean;
  reason: string | null;
}

@Injectable()
export class PortalMailService {
  private readonly logger = new ContextLogger(PortalMailService.name);

  constructor(private readonly mailService: MailService) {}

  async send(
    to: string,
    email: PortalEmail,
    replyTo?: string | null,
  ): Promise<PortalMailResult> {
    try {
      await this.mailService.sendEmail({
        to,
        subject: email.subject,
        text: email.text,
        html: email.html,
        ...(replyTo && { replyTo }),
      });
      return { sent: true, reason: null };
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Mail is not configured';
      this.logger.warn(`Portal email not sent: ${reason}`);
      return { sent: false, reason };
    }
  }

  sendInBackground(to: string, email: PortalEmail): void {
    void this.send(to, email);
  }
}
