import { Injectable } from '@nestjs/common';
import { UserTimeOffRepository } from '@db/repositories';
import { TimeOffResponseDto } from '../../dtos/interview-booking.dto';
import { toTimeOffResponse } from '../time-off-response';
import { ListMyTimeOffCommand } from './list-my-time-off.command';

const LIST_LIMIT = 200;

@Injectable()
export class ListMyTimeOff {
  constructor(private readonly timeOffRepository: UserTimeOffRepository) {}

  async execute(command: ListMyTimeOffCommand): Promise<TimeOffResponseDto[]> {
    const qb = this.timeOffRepository
      .createQueryBuilder('timeOff')
      .where('timeOff.organizationId = :organizationId', {
        organizationId: command.organizationId,
      })
      .andWhere('timeOff.userId = :userId', { userId: command.userId })
      .andWhere('timeOff.endsAt > :from', {
        from: command.from ? new Date(command.from) : new Date(),
      });
    if (command.to) {
      qb.andWhere('timeOff.startsAt < :to', { to: new Date(command.to) });
    }
    const rows = await qb
      .orderBy('timeOff.startsAt', 'ASC')
      .take(LIST_LIMIT)
      .getMany();
    return rows.map(toTimeOffResponse);
  }
}
