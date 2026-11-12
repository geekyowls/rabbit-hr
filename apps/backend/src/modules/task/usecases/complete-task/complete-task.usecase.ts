import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityRepository, TaskRepository } from '@db/repositories';
import { ActivityType, TaskStatus } from '@db/enums';
import { loadTask } from '../get-task';
import { CompleteTaskCommand } from './complete-task.command';

@Injectable()
export class CompleteTask {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(command: CompleteTaskCommand) {
    const task = await this.taskRepository.findOne({
      where: { id: command.taskId, organizationId: command.organizationId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status !== TaskStatus.DONE) {
      task.status = TaskStatus.DONE;
      task.completedAt = new Date();
      await this.taskRepository.save(task);

      if (
        task.candidateId ||
        task.applicationId ||
        task.jobId ||
        task.clientId
      ) {
        await this.activityRepository.record({
          organizationId: command.organizationId,
          candidateId: task.candidateId,
          applicationId: task.applicationId,
          jobId: task.jobId,
          clientId: task.clientId,
          type: ActivityType.TASK,
          title: `Task completed: ${task.title}`,
          metadata: { taskId: task.id },
          actorId: command.userId,
        });
      }
    }

    return loadTask(this.taskRepository, task.id, command.organizationId);
  }
}
