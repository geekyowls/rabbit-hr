import { Injectable } from '@nestjs/common';
import { calculateSkip, createPaginationMetadata } from '@boilerplate/core';
import { TaskRepository } from '@db/repositories';
import { TaskDueFilter } from '@db/enums';
import { buildTaskQuery } from '../task-query';
import { ListTasksCommand } from './list-tasks.command';

const LINK_COLUMNS = [
  'candidateId',
  'applicationId',
  'jobId',
  'clientId',
] as const;

@Injectable()
export class ListTasks {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(command: ListTasksCommand) {
    const qb = buildTaskQuery(this.taskRepository, command.organizationId);

    if (command.search) {
      qb.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${command.search}%` },
      );
    }
    if (command.status) {
      qb.andWhere('task.status = :status', { status: command.status });
    }
    const assigneeId = command.mine ? command.userId : command.assigneeId;
    if (assigneeId) {
      qb.andWhere('task.assigneeId = :assigneeId', { assigneeId });
    }
    for (const column of LINK_COLUMNS) {
      const value = command[column];
      if (value) {
        qb.andWhere(`task.${column} = :${column}`, { [column]: value });
      }
    }

    if (command.due) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTomorrow = new Date(startOfToday);
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

      if (command.due === TaskDueFilter.OVERDUE) {
        qb.andWhere('task.dueAt < :startOfToday', { startOfToday });
      } else if (command.due === TaskDueFilter.TODAY) {
        qb.andWhere(
          'task.dueAt >= :startOfToday AND task.dueAt < :startOfTomorrow',
          { startOfToday, startOfTomorrow },
        );
      } else {
        qb.andWhere('task.dueAt >= :startOfTomorrow', { startOfTomorrow });
      }
    }

    qb.orderBy('task.status', 'ASC')
      .addOrderBy('task.dueAt', 'ASC', 'NULLS LAST')
      .addOrderBy('task.createdAt', 'DESC')
      .skip(calculateSkip(command.page, command.limit))
      .take(command.limit);

    const [tasks, total] = await qb.getManyAndCount();

    return {
      data: tasks,
      ...createPaginationMetadata(command.page, command.limit, total),
    };
  }
}
