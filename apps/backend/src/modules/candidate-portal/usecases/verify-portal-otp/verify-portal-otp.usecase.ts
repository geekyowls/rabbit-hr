import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { CandidateRepository, OrganizationRepository } from '@db/repositories';
import { CustomFieldEntityType } from '@db/enums';
import { CustomFieldValidator } from '@shared/services/custom-field-validator.service';
import {
  findPortalOrganizationBySlug,
  toPortalBranding,
} from '../portal-query';
import { toPortalProfile } from '../portal-profile';
import { PortalOtpStore } from '../../services/portal-otp.store';
import { PortalTokenService } from '../../services/portal-token.service';
import { VerifyPortalOtpCommand } from './verify-portal-otp.command';

const INVALID_CODE = 'That code is not right or has expired';

@Injectable()
export class VerifyPortalOtp {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly otpStore: PortalOtpStore,
    private readonly tokenService: PortalTokenService,
    private readonly customFieldValidator: CustomFieldValidator,
  ) {}

  async execute(command: VerifyPortalOtpCommand) {
    const email = command.email.trim().toLowerCase();
    const organization = await findPortalOrganizationBySlug(
      this.organizationRepository,
      command.orgSlug,
    );
    const result = await this.otpStore.check(
      organization.id,
      email,
      command.code,
    );
    if (result === 'locked') {
      throw new HttpException(
        'Too many wrong codes. Request a new code to try again',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (result === 'invalid') {
      throw new BadRequestException(INVALID_CODE);
    }

    const candidate = await this.candidateRepository.findOne({
      where: { organizationId: organization.id, email },
    });
    if (!candidate) {
      throw new BadRequestException(INVALID_CODE);
    }

    candidate.portalLastLoginAt = new Date();
    await this.candidateRepository.update(
      { id: candidate.id, organizationId: organization.id },
      { portalLastLoginAt: candidate.portalLastLoginAt },
    );
    const tokens = await this.tokenService.issue(candidate, {
      userAgent: command.userAgent,
      ipAddress: command.ipAddress,
    });
    const definitions = await this.customFieldValidator.getActiveDefinitions(
      organization.id,
      CustomFieldEntityType.CANDIDATE,
      true,
    );
    return {
      ...tokens,
      candidate: toPortalProfile(candidate, definitions),
      organization: toPortalBranding(organization),
    };
  }
}
