import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import {
  ActivityRepository,
  InterviewRepository,
  ScorecardRepository,
  UserRepository,
} from '@db/repositories';
import { InterviewStatus } from '@db/enums';
import { assertInterviewers, loadInterviewEntity } from '../interview-query';
import { recordInterviewActivity } from '../interview-activity';
import { GetInterview } from '../get-interview/get-interview.usecase';
import { SubmitScorecardCommand } from './submit-scorecard.command';

@Injectable()
export class SubmitScorecard {
  constructor(
    private readonly interviewRepository: InterviewRepository,
    private readonly scorecardRepository: ScorecardRepository,
    private readonly userRepository: UserRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly getInterview: GetInterview,
  ) {}

  async execute(command: SubmitScorecardCommand) {
    const { organizationId, userId, payload } = command;
    const interview = await loadInterviewEntity(
      this.interviewRepository,
      command.interviewId,
      organizationId,
    );
    if (interview.status === InterviewStatus.CANCELLED) {
      throw new BadRequestException(
        'Scorecards cannot be submitted for a cancelled interview',
      );
    }

    const canManage = command.permissions.includes(
      PERMISSIONS_ENUM.INTERVIEW_MANAGE,
    );
    const interviewerId = payload.interviewerId ?? userId;
    if (interviewerId !== userId && !canManage) {
      throw new ForbiddenException(
        'Only managers can submit a scorecard on behalf of another interviewer',
      );
    }
    if (!interview.interviewerIds.includes(interviewerId) && !canManage) {
      throw new ForbiddenException(
        'Only interviewers assigned to this interview can submit a scorecard',
      );
    }
    await assertInterviewers(this.userRepository, organizationId, [
      interviewerId,
    ]);

    const existing = await this.scorecardRepository.findOne({
      where: { interviewId: interview.id, interviewerId },
    });
    const values = {
      overallRating: payload.overallRating,
      recommendation: payload.recommendation,
      criteria: (payload.criteria ?? []).map((c) => ({
        name: c.name,
        rating: c.rating,
        note: c.note ?? null,
      })),
      summary: payload.summary ?? null,
      submittedAt: new Date(),
    };
    await this.scorecardRepository.save(
      existing
        ? Object.assign(existing, values)
        : this.scorecardRepository.create({
            ...values,
            organizationId,
            interviewId: interview.id,
            applicationId: interview.applicationId,
            interviewerId,
          }),
    );

    await recordInterviewActivity(this.activityRepository, {
      interview,
      event: existing ? 'scorecard_updated' : 'scorecard_submitted',
      title: existing
        ? `Scorecard updated: ${interview.title}`
        : `Scorecard submitted: ${interview.title}`,
      body: payload.summary ?? null,
      actorId: userId,
      metadata: {
        interviewerId,
        overallRating: payload.overallRating,
        recommendation: payload.recommendation,
      },
    });

    return this.getInterview.execute(interview.id, organizationId);
  }
}
