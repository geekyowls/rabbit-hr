import { Injectable } from '@nestjs/common';
import { EventName, type InterviewCancelledEvent } from '@boilerplate/core';
import { InterviewStatus } from '@db/enums';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { ActivityRepository, InterviewRepository } from '@db/repositories';
import { interviewExternalRefs, loadInterviewEntity } from '../interview-query';
import { recordInterviewActivity } from '../interview-activity';

@Injectable()
export class DeleteInterview {
  constructor(
    private readonly interviewRepository: InterviewRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly eventEmitter: AppEventEmitter,
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
    if (interview.status !== InterviewStatus.CANCELLED) {
      this.eventEmitter.emit<InterviewCancelledEvent>({
        eventName: EventName.INTERVIEW_CANCELLED,
        timestamp: new Date(),
        organizationId,
        triggeredBy: userId,
        interviewId: interview.id,
        applicationId: interview.applicationId,
        deleted: true,
        reason: null,
        externalRefs: interviewExternalRefs(interview),
      });
    }
    return { success: true };
  }
}
