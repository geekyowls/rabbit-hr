import { Injectable, NotFoundException } from '@nestjs/common';
import { UserTimeOffRepository } from '@db/repositories';
import { TimeOffResponseDto } from '../../dtos/interview-booking.dto';
import { parseTimeOffRange, toTimeOffResponse } from '../time-off-response';
import { UpdateMyTimeOffCommand } from './update-my-time-off.command';

@Injectable()
export class UpdateMyTimeOff {
  constructor(private readonly timeOffRepository: UserTimeOffRepository) {}

  async execute(command: UpdateMyTimeOffCommand): Promise<TimeOffResponseDto> {
    const row = await this.timeOffRepository.findOne({
      where: {
        id: command.timeOffId,
        organizationId: command.organizationId,
        userId: command.userId,
      },
    });
    if (!row) {
      throw new NotFoundException('Time off not found');
    }
    Object.assign(row, parseTimeOffRange(command.payload));
    return toTimeOffResponse(await this.timeOffRepository.save(row));
  }
}
