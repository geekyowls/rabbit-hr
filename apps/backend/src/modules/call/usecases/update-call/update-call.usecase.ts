import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityRepository, CandidateCallRepository } from '@db/repositories';
import { loadCall } from '../call-query';
import { UpdateCallCommand } from './update-call.command';

@Injectable()
export class UpdateCall {
  constructor(
    private readonly callRepository: CandidateCallRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(command: UpdateCallCommand) {
    const call = await this.callRepository.findOne({
      where: { id: command.callId, organizationId: command.organizationId },
    });
    if (!call) throw new NotFoundException('Call not found');

    if (command.disposition !== undefined) {
      call.disposition = command.disposition;
    }
    if (command.note !== undefined) {
      call.note = command.note?.trim() || null;
    }
    await this.callRepository.save(call);

    if (call.activityId) {
      const activity = await this.activityRepository.findOne({
        where: { id: call.activityId, organizationId: call.organizationId },
      });
      if (activity) {
        activity.body = call.note;
        activity.metadata = {
          ...(activity.metadata ?? {}),
          disposition: call.disposition,
        };
        await this.activityRepository.save(activity);
      }
    }

    return loadCall(this.callRepository, command.organizationId, call.id);
  }
}
