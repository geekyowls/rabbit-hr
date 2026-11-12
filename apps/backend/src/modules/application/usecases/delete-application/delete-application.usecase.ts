import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationRepository } from '@db/repositories';
import { DeleteApplicationCommand } from './delete-application.command';

@Injectable()
export class DeleteApplication {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async execute(
    command: DeleteApplicationCommand,
  ): Promise<{ success: boolean }> {
    const result = await this.applicationRepository.delete({
      id: command.applicationId,
      organizationId: command.organizationId,
    });
    if (!result.affected) {
      throw new NotFoundException('Application not found');
    }
    return { success: true };
  }
}
