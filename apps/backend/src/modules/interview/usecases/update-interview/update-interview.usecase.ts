import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ActivityRepository,
  InterviewRepository,
  UserRepository,
} from '@db/repositories';
import { InterviewStatus } from '@db/enums';
import { pickDefined } from '@shared/helpers/pick-defined';
import { assertInterviewers, loadInterviewEntity } from '../interview-query';
import { recordInterviewActivity } from '../interview-activity';
import { InterviewInviteService } from '../interview-invite.service';
import { GetInterview } from '../get-interview/get-interview.usecase';
import { UpdateInterviewCommand } from './update-interview.command';

@Injectable()
export class UpdateInterview {
  constructor(
    private readonly interviewRepository: InterviewRepository,
    private readonly userRepository: UserRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly interviewInviteService: InterviewInviteService,
    private readonly getInterview: GetInterview,
  ) {}

  async execute(command: UpdateInterviewCommand) {
    const { organizationId, userId } = command;
    const interview = await loadInterviewEntity(
      this.interviewRepository,
      command.interviewId,
      organizationId,
    );
    if (interview.status === InterviewStatus.CANCELLED) {
      throw new BadRequestException('Cancelled interviews cannot be updated');
    }

    const { notifyCandidate, scheduledAt, ...changes } = pickDefined(
      command.payload,
    );
    if (changes.interviewerIds) {
      await assertInterviewers(
        this.userRepository,
        organizationId,
        changes.interviewerIds,
      );
    }

    const previousAt = new Date(interview.scheduledAt).getTime();
    const nextAt = scheduledAt ? new Date(scheduledAt) : null;
    const rescheduled = !!nextAt && nextAt.getTime() !== previousAt;

    Object.assign(interview, changes, nextAt ? { scheduledAt: nextAt } : {});
    if (rescheduled && interview.status !== InterviewStatus.SCHEDULED) {
      interview.status = InterviewStatus.SCHEDULED;
    }
    const saved = await this.interviewRepository.save(interview);

    await recordInterviewActivity(this.activityRepository, {
      interview: saved,
      event: rescheduled ? 'rescheduled' : 'updated',
      title: rescheduled
        ? `Interview rescheduled: ${saved.title}`
        : `Interview updated: ${saved.title}`,
      actorId: userId,
      metadata: rescheduled
        ? { previousScheduledAt: new Date(previousAt).toISOString() }
        : undefined,
    });

    if (notifyCandidate) {
      this.interviewInviteService.notifyInBackground(
        saved,
        userId,
        rescheduled,
      );
    }

    return this.getInterview.execute(saved.id, organizationId);
  }
}
