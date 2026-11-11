import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskRepository } from '@db/repositories';
import { DeleteTaskCommand } from './delete-task.command';

@Injectable()
export class DeleteTask {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(command: DeleteTaskCommand): Promise<{ success: boolean }> {
    const result = await this.taskRepository.delete({
      id: command.taskId,
      organizationId: command.organizationId,
    });
    if (!result.affected) {
      throw new NotFoundException('Task not found');
    }
    return { success: true };
  }
}
