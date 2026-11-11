import { Injectable } from '@nestjs/common';
import { ActivityRepository, InterviewRepository } from '@db/repositories';
import { loadInterviewEntity } from '../interview-query';
import { recordInterviewActivity } from '../interview-activity';

@Injectable()
export class DeleteInterview {
  constructor(
    private readonly interviewRepository: InterviewRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(interviewId: string, organizationId: string, userId: string) {
    const interview = await loadInterviewEntity(
      this.interviewRepository,
      interviewId,
      organizationId,
    );
    await this.interviewRepository.delete({ id: interview.id, organizationId });
    await recordInterviewActivity(this.activityRepository, {
      interview,
      event: 'deleted',
      title: `Interview deleted: ${interview.title}`,
      actorId: userId,
    });
    return { success: true };
  }
}
