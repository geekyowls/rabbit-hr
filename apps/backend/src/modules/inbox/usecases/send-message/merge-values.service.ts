import { Injectable } from '@nestjs/common';
import {
  CandidateRepository,
  OrganizationRepository,
  UserRepository,
} from '@db/repositories';
import { CandidateEmailService } from '@modules/email-template/services/candidate-email.service';
import type { MergeFieldValues } from '@modules/email-template/usecases/render-merge-fields';

export interface InboxMergeContext {
  values: MergeFieldValues;
  candidateId: string | null;
  clientId: string | null;
  senderName: string | null;
}

@Injectable()
export class InboxMergeValues {
  constructor(
    private readonly candidateEmailService: CandidateEmailService,
    private readonly candidateRepository: CandidateRepository,
    private readonly userRepository: UserRepository,
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async load(params: {
    organizationId: string;
    userId: string;
    candidateId: string | null;
    applicationId: string | null;
  }): Promise<InboxMergeContext> {
    const { organizationId, userId } = params;
    if (params.applicationId) {
      const context = await this.candidateEmailService.loadContext(
        params.applicationId,
        organizationId,
        userId,
      );
      return {
        values: context.values,
        candidateId: context.candidateId,
        clientId: context.clientId,
        senderName: context.values['recruiter.name'] ?? null,
      };
    }

    const [candidate, recruiter, organization] = await Promise.all([
      params.candidateId
        ? this.candidateRepository.findOne({
            where: { id: params.candidateId, organizationId },
            select: ['id', 'firstName', 'lastName', 'email'],
          })
        : null,
      this.userRepository.findOne({
        where: { id: userId, organizationId },
        select: ['id', 'firstName', 'lastName', 'email'],
      }),
      this.organizationRepository.findOne({
        where: { id: organizationId },
        select: ['id', 'name'],
      }),
    ]);
    const recruiterName =
      [recruiter?.firstName, recruiter?.lastName].filter(Boolean).join(' ') ||
      null;
    return {
      candidateId: candidate?.id ?? null,
      clientId: null,
      senderName: recruiterName,
      values: {
        'candidate.firstName': candidate?.firstName,
        'candidate.lastName': candidate?.lastName,
        'candidate.fullName': candidate
          ? `${candidate.firstName} ${candidate.lastName}`
          : undefined,
        'candidate.email': candidate?.email,
        'recruiter.name': recruiterName ?? recruiter?.email,
        'recruiter.firstName': recruiter?.firstName,
        'recruiter.email': recruiter?.email,
        'organization.name': organization?.name,
      },
    };
  }
}
