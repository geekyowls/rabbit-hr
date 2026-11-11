import { Injectable, NotFoundException } from '@nestjs/common';
import { JobRepository } from '@db/repositories';
import { DeleteJobCommand } from './delete-job.command';

@Injectable()
export class DeleteJob {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(command: DeleteJobCommand): Promise<{ success: boolean }> {
    const result = await this.jobRepository.delete({
      id: command.jobId,
      organizationId: command.organizationId,
    });
    if (!result.affected) {
      throw new NotFoundException('Job not found');
    }
    return { success: true };
  }
}
