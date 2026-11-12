import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CandidateRepository, OrganizationRepository } from '@db/repositories';
import { ContextLogger } from '@shared/framework/context-logger';
import {
  findPortalOrganizationBySlug,
  toPortalBranding,
} from '../portal-query';
import {
  PORTAL_OTP_EXPIRY_MINUTES,
  PortalOtpStore,
} from '../../services/portal-otp.store';
import { PortalMailService } from '../../services/portal-mail.service';
import { buildPortalOtpEmail } from '../../services/portal-email.templates';
import { RequestPortalOtpCommand } from './request-portal-otp.command';

@Injectable()
export class RequestPortalOtp {
  private readonly logger = new ContextLogger(RequestPortalOtp.name);

  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly otpStore: PortalOtpStore,
    private readonly portalMail: PortalMailService,
    private readonly config: ConfigService,
  ) {}

  async execute(command: RequestPortalOtpCommand) {
    const email = command.email.trim().toLowerCase();
    const organization = await findPortalOrganizationBySlug(
      this.organizationRepository,
      command.orgSlug,
    );
    await this.otpStore.assertCanRequest(organization.id, email);

    const candidate = await this.candidateRepository.findOne({
      where: { organizationId: organization.id, email },
      select: ['id', 'firstName', 'email'],
    });
    if (candidate) {
      const code = await this.otpStore.issue(organization.id, email);
      if (this.config.get<string>('NODE_ENV') !== 'production') {
        this.logger.log(`[DEV] Portal sign in code for ${email}: ${code}`);
      }
      this.portalMail.sendInBackground(
        candidate.email,
        buildPortalOtpEmail({
          branding: toPortalBranding(organization),
          firstName: candidate.firstName,
          code,
          expiresInMinutes: PORTAL_OTP_EXPIRY_MINUTES,
        }),
      );
    }

    return { sent: true, expiresIn: PORTAL_OTP_EXPIRY_MINUTES * 60 };
  }
}
