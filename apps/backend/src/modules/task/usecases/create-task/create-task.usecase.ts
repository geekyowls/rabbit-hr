import { Injectable } from '@nestjs/common';
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
import { CreateTaskCommand } from './create-task.command';

@Injectable()
export class CreateTask {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly userRepository: UserRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly jobRepository: JobRepository,
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(command: CreateTaskCommand) {
    const { dueAt, ...payload } = pickDefined(command.payload);
    await assertTaskLinks(
      {
        userRepository: this.userRepository,
        candidateRepository: this.candidateRepository,
        applicationRepository: this.applicationRepository,
        jobRepository: this.jobRepository,
        clientRepository: this.clientRepository,
      },
      command.organizationId,
      payload,
    );

    const task = await this.taskRepository.save(
      this.taskRepository.create({
        ...payload,
        dueAt: dueAt ? new Date(dueAt) : null,
        assigneeId: payload.assigneeId ?? command.userId,
        status: TaskStatus.OPEN,
        createdBy: command.userId,
        organizationId: command.organizationId,
      }),
    );

    return loadTask(this.taskRepository, task.id, command.organizationId);
  }
}
