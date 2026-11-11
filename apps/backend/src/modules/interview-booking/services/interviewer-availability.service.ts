import { Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import {
  InterviewEntity,
  InterviewerAvailabilityEntity,
  UserTimeOffEntity,
  WeeklyHoursInterval,
} from '@db/entities';
import { InterviewStatus } from '@db/enums';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import { AvailabilitySettings, InterviewerSchedule } from './slot-engine';

const MINUTE = 60_000;
const LOOKBACK_MS = 24 * 60 * MINUTE;

export const DEFAULT_WEEKLY_HOURS: WeeklyHoursInterval[] = [1, 2, 3, 4, 5].map(
  (day) => ({ day, start: '09:00', end: '17:00' }),
);

export const DEFAULT_AVAILABILITY = {
  bufferMinutes: 0,
  minNoticeMinutes: 240,
  maxDaysAhead: 30,
};

export interface ResolvedAvailability extends AvailabilitySettings {
  userId: string;
  isDefault: boolean;
}

@Injectable()
export class InterviewerAvailabilityService {
  constructor(private readonly atsSettingsService: AtsSettingsService) {}

  async resolve(
    manager: EntityManager,
    organizationId: string,
    userIds: string[],
  ): Promise<ResolvedAvailability[]> {
    if (userIds.length === 0) return [];
    const [rows, settings] = await Promise.all([
      manager.getRepository(InterviewerAvailabilityEntity).find({
        where: { organizationId, userId: In(userIds) },
      }),
      this.atsSettingsService.get(organizationId),
    ]);
    const byUser = new Map(rows.map((r) => [r.userId, r]));
    return userIds.map((userId) => {
      const row = byUser.get(userId);
      if (!row) {
        return {
          userId,
          timezone: settings.timezone,
          weeklyHours: DEFAULT_WEEKLY_HOURS,
          ...DEFAULT_AVAILABILITY,
          isDefault: true,
        };
      }
      return {
        userId,
        timezone: row.timezone,
        weeklyHours: row.weeklyHours,
        bufferMinutes: row.bufferMinutes,
        minNoticeMinutes: row.minNoticeMinutes,
        maxDaysAhead: row.maxDaysAhead,
        isDefault: false,
      };
    });
  }

  async loadSchedules(
    manager: EntityManager,
    organizationId: string,
    userIds: string[],
    from: Date,
    to: Date,
  ): Promise<InterviewerSchedule[]> {
    if (userIds.length === 0) return [];
    const [availability, interviews, timeOff] = await Promise.all([
      this.resolve(manager, organizationId, userIds),
      manager
        .getRepository(InterviewEntity)
        .createQueryBuilder('interview')
        .select([
          'interview.id',
          'interview.scheduledAt',
          'interview.durationMinutes',
          'interview.interviewerIds',
        ])
        .where('interview.organizationId = :organizationId', {
          organizationId,
        })
        .andWhere('interview.status = :status', {
          status: InterviewStatus.SCHEDULED,
        })
        .andWhere('interview.interviewerIds && CAST(:userIds AS uuid[])', {
          userIds,
        })
        .andWhere('interview.scheduledAt < :to', { to })
        .andWhere('interview.scheduledAt > :earliest', {
          earliest: new Date(from.getTime() - LOOKBACK_MS),
        })
        .getMany(),
      manager
        .getRepository(UserTimeOffEntity)
        .createQueryBuilder('timeOff')
        .where('timeOff.organizationId = :organizationId', { organizationId })
        .andWhere('timeOff.userId IN (:...userIds)', { userIds })
        .andWhere('timeOff.startsAt < :to', { to })
        .andWhere('timeOff.endsAt > :from', { from })
        .getMany(),
    ]);

    return availability.map((a) => ({
      userId: a.userId,
      availability: a,
      interviews: interviews
        .filter((i) => i.interviewerIds.includes(a.userId))
        .map((i) => {
          const start = new Date(i.scheduledAt);
          return {
            start,
            end: new Date(start.getTime() + i.durationMinutes * MINUTE),
          };
        }),
      timeOff: timeOff
        .filter((t) => t.userId === a.userId)
        .map((t) => ({ start: new Date(t.startsAt), end: new Date(t.endsAt) })),
    }));
  }
}
