import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ApplicationRepository,
  InterviewRepository,
  ScorecardRepository,
  UserRepository,
} from '@db/repositories';
import { buildInterviewQuery, hydrateInterviews } from '../interview-query';

@Injectable()
export class ListApplicationInterviews {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly scorecardRepository: ScorecardRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(applicationId: string, organizationId: string) {
    const exists = await this.applicationRepository.exists({
      where: { id: applicationId, organizationId },
    });
    if (!exists) {
      throw new NotFoundException('Application not found');
    }
    const interviews = await buildInterviewQuery(
      this.interviewRepository,
      organizationId,
    )
      .andWhere('interview.applicationId = :applicationId', { applicationId })
      .orderBy('interview.scheduledAt', 'DESC')
      .getMany();
    return hydrateInterviews(
      {
        interviewRepository: this.interviewRepository,
        scorecardRepository: this.scorecardRepository,
        userRepository: this.userRepository,
      },
      organizationId,
      interviews,
    );
  }
}
