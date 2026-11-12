import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ApplicationRepository,
  CandidateRepository,
  ClientRepository,
  JobRepository,
  TaskRepository,
  UserRepository,
} from '@db/repositories';
import { TaskStatus } from '@db/enums';
import { pickDefined } from '@shared/helpers/pick-defined';
import { assertTaskLinks } from '../task-query';
import { loadTask } from '../get-task';
import { UpdateTaskCommand } from './update-task.command';

@Injectable()
export class UpdateTask {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly userRepository: UserRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly jobRepository: JobRepository,
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(command: UpdateTaskCommand) {
    const task = await this.taskRepository.findOne({
      where: { id: command.taskId, organizationId: command.organizationId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const { dueAt, status, ...rest } = pickDefined(command.payload);
    await assertTaskLinks(
      {
        userRepository: this.userRepository,
        candidateRepository: this.candidateRepository,
        applicationRepository: this.applicationRepository,
        jobRepository: this.jobRepository,
        clientRepository: this.clientRepository,
      },
      command.organizationId,
      rest,
    );

    Object.assign(task, rest);
    if (dueAt !== undefined) {
      task.dueAt = dueAt ? new Date(dueAt) : null;
    }
    if (status && status !== task.status) {
      task.status = status;
      task.completedAt = status === TaskStatus.DONE ? new Date() : null;
    }

    await this.taskRepository.save(task);
    return loadTask(this.taskRepository, task.id, command.organizationId);
  }
}
