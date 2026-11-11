import { BadRequestException, Injectable } from '@nestjs/common';
import { ActivityRepository, InterviewRepository } from '@db/repositories';
import { InterviewStatus } from '@db/enums';
import { loadInterviewEntity } from '../interview-query';
import { recordInterviewActivity } from '../interview-activity';
import { GetInterview } from '../get-interview/get-interview.usecase';
import { UpdateInterviewStatusCommand } from './update-interview-status.command';

const STATUS_TITLES: Record<InterviewStatus, string> = {
  [InterviewStatus.SCHEDULED]: 'Interview reopened',
  [InterviewStatus.COMPLETED]: 'Interview completed',
  [InterviewStatus.CANCELLED]: 'Interview cancelled',
  [InterviewStatus.NO_SHOW]: 'Candidate did not attend the interview',
};

@Injectable()
export class UpdateInterviewStatus {
  constructor(
    private readonly interviewRepository: InterviewRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly getInterview: GetInterview,
  ) {}

  async execute(command: UpdateInterviewStatusCommand) {
    const interview = await loadInterviewEntity(
      this.interviewRepository,
      command.interviewId,
      command.organizationId,
    );
    if (interview.status === command.status) {
      throw new BadRequestException(`Interview is already ${command.status}`);
    }
    if (interview.status === InterviewStatus.CANCELLED) {
      throw new BadRequestException(
        'Cancelled interviews cannot change status, schedule a new interview instead',
      );
    }
    const reason = command.reason?.trim() || null;
    const cancelling = command.status === InterviewStatus.CANCELLED;
    if (cancelling && !reason) {
      throw new BadRequestException(
        'A reason is required to cancel an interview',
      );
    }

    interview.status = command.status;
    interview.cancelledReason = cancelling ? reason : null;
    const saved = await this.interviewRepository.save(interview);

    await recordInterviewActivity(this.activityRepository, {
      interview: saved,
      event: command.status,
      title: `${STATUS_TITLES[command.status]}: ${saved.title}`,
      body: reason,
      actorId: command.userId,
    });

    return this.getInterview.execute(saved.id, command.organizationId);
  }
}
