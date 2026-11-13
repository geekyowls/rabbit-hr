import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  CandidatePortalSessionRepository,
  CandidateRepository,
  OrganizationRepository,
} from '@db/repositories';
import { OrganizationStatus } from '@db/enums';
import { PortalAvailabilityService } from '@shared/services/portal-availability.service';
import { PortalTokenService } from '../../services/portal-token.service';
import { loadPortalOrganization } from '../portal-query';
import { RefreshPortalSessionCommand } from './refresh-portal-session.command';

@Injectable()
export class RefreshPortalSession {
  constructor(
    private readonly tokenService: PortalTokenService,
    private readonly sessionRepository: CandidatePortalSessionRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly portalAvailability: PortalAvailabilityService,
  ) {}

  async execute(command: RefreshPortalSessionCommand) {
    const payload = this.tokenService.verifyRefresh(command.refreshToken);
    const session = await this.sessionRepository.findActiveByJti(payload.jti!);
    if (
      !session ||
      session.candidateId !== payload.candidateId ||
      session.organizationId !== payload.organizationId ||
      session.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Session has expired');
    }
    await this.sessionRepository.revokeByJti(session.jti);

    const [candidate, organization] = await Promise.all([
      this.candidateRepository.findOne({
        where: {
          id: session.candidateId,
          organizationId: session.organizationId,
        },
        select: ['id', 'organizationId', 'email'],
      }),
      loadPortalOrganization(
        this.organizationRepository,
        session.organizationId,
      ),
    ]);
    if (
      !candidate ||
      organization.status !== OrganizationStatus.ACTIVE ||
      !(await this.portalAvailability.isEnabled(organization))
    ) {
      throw new UnauthorizedException('Session has expired');
    }
    return this.tokenService.issue(candidate, {
      userAgent: command.userAgent,
      ipAddress: command.ipAddress,
    });
  }
}
