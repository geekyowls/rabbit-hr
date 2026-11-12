import { NotFoundException } from '@nestjs/common';
import { TaskRepository } from '@db/repositories';
import { buildTaskQuery } from './task-query';

export async function loadTask(
  taskRepository: TaskRepository,
  taskId: string,
  organizationId: string,
) {
  const task = await buildTaskQuery(taskRepository, organizationId)
    .andWhere('task.id = :taskId', { taskId })
    .getOne();
  if (!task) {
    throw new NotFoundException('Task not found');
  }
  return task;
}
