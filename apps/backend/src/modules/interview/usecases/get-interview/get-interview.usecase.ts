import { Injectable } from '@nestjs/common';
import {
  InterviewRepository,
  ScorecardRepository,
  UserRepository,
} from '@db/repositories';
import { loadInterviewDetail } from '../interview-query';

@Injectable()
export class GetInterview {
  constructor(
    private readonly interviewRepository: InterviewRepository,
    private readonly scorecardRepository: ScorecardRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(interviewId: string, organizationId: string) {
    return loadInterviewDetail(
      {
        interviewRepository: this.interviewRepository,
        scorecardRepository: this.scorecardRepository,
        userRepository: this.userRepository,
      },
      interviewId,
      organizationId,
    );
  }
}
