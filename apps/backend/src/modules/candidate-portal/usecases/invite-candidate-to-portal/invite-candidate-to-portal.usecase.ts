import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ActivityRepository,
  CandidateRepository,
  OrganizationRepository,
  UserRepository,
} from '@db/repositories';
import { resolveAtsSettings } from '@db/entities';
import { ActivityType } from '@db/enums';
import {
  loadPortalCandidate,
  loadPortalOrganization,
  toPortalBranding,
} from '../portal-query';
import { PortalMailService } from '../../services/portal-mail.service';
import { buildPortalInviteEmail } from '../../services/portal-email.templates';
import { InviteCandidateToPortalCommand } from './invite-candidate-to-portal.command';

export function portalLoginUrl(
  config: ConfigService,
  orgSlug: string,
  email: string,
): string {
  const base = (
    config.get<string>('FRONTEND_URL') || 'http://localhost:3000'
  ).replace(/\/+$/, '');
  return `${base}/portal/login?org=${encodeURIComponent(orgSlug)}&email=${encodeURIComponent(email)}`;
}

@Injectable()
export class InviteCandidateToPortal {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly portalMail: PortalMailService,
    private readonly config: ConfigService,
  ) {}

  async execute(command: InviteCandidateToPortalCommand) {
    const { organizationId, candidateId, userId } = command;
    const [candidate, organization, recruiter] = await Promise.all([
      loadPortalCandidate(
        this.candidateRepository,
        candidateId,
        organizationId,
      ),
      loadPortalOrganization(this.organizationRepository, organizationId),
      this.userRepository.findOne({
        where: { id: userId, organizationId },
        select: ['id', 'firstName', 'lastName', 'email'],
      }),
    ]);
    const branding = toPortalBranding(
      organization,
      resolveAtsSettings(organization.atsSettings).portalEnabled,
    );
    if (!branding.portalEnabled) {
      throw new BadRequestException(
        'Turn on the candidate portal in hiring preferences first',
      );
    }

    const loginUrl = portalLoginUrl(
      this.config,
      branding.slug,
      candidate.email,
    );
    const recruiterName =
      [recruiter?.firstName, recruiter?.lastName].filter(Boolean).join(' ') ||
      null;
    const result = await this.portalMail.send(
      candidate.email,
      buildPortalInviteEmail({
        branding,
        firstName: candidate.firstName,
        loginUrl,
        recruiterName,
      }),
      recruiter?.email,
    );

    const portalInvitedAt = new Date();
    await this.candidateRepository.update(
      { id: candidateId, organizationId },
      { portalInvitedAt },
    );
    await this.activityRepository.record({
      organizationId,
      candidateId,
      type: ActivityType.PORTAL,
      title: result.sent
        ? 'Invited to the candidate portal'
        : 'Portal invite could not be emailed',
      body: result.reason,
      metadata: {
        source: 'portal',
        action: 'invite',
        to: candidate.email,
        sent: result.sent,
      },
      actorId: userId,
    });

    return { ...result, portalInvitedAt, loginUrl };
  }
}
