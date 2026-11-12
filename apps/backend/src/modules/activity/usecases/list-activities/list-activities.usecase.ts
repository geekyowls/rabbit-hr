import { Injectable } from '@nestjs/common';
import { calculateSkip, createPaginationMetadata } from '@boilerplate/core';
import { ActivityRepository } from '@db/repositories';
import { buildActivityQuery } from '../activity-query';
import { ListActivitiesCommand } from './list-activities.command';

const FILTER_COLUMNS = [
  'candidateId',
  'applicationId',
  'jobId',
  'clientId',
] as const;

@Injectable()
export class ListActivities {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async execute(command: ListActivitiesCommand) {
    const qb = buildActivityQuery(
      this.activityRepository,
      command.organizationId,
    );

    for (const column of FILTER_COLUMNS) {
      const value = command[column];
      if (value) {
        qb.andWhere(`activity.${column} = :${column}`, { [column]: value });
      }
    }

    qb.orderBy('activity.createdAt', 'DESC')
      .skip(calculateSkip(command.page, command.limit))
      .take(command.limit);

    const [activities, total] = await qb.getManyAndCount();

    return {
      data: activities,
      ...createPaginationMetadata(command.page, command.limit, total),
    };
  }
}
