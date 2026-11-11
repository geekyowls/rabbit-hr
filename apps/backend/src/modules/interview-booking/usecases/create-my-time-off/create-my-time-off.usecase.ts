import { Injectable } from '@nestjs/common';
import { UserTimeOffRepository } from '@db/repositories';
import { TimeOffResponseDto } from '../../dtos/interview-booking.dto';
import { parseTimeOffRange, toTimeOffResponse } from '../time-off-response';
import { CreateMyTimeOffCommand } from './create-my-time-off.command';

@Injectable()
export class CreateMyTimeOff {
  constructor(private readonly timeOffRepository: UserTimeOffRepository) {}

  async execute(command: CreateMyTimeOffCommand): Promise<TimeOffResponseDto> {
    const saved = await this.timeOffRepository.save(
      this.timeOffRepository.create({
        organizationId: command.organizationId,
        userId: command.userId,
        createdBy: command.userId,
        ...parseTimeOffRange(command.payload),
      }),
    );
    return toTimeOffResponse(saved);
  }
}
