import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientRepository } from '@db/repositories';
import { DeleteClientCommand } from './delete-client.command';

@Injectable()
export class DeleteClient {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(command: DeleteClientCommand): Promise<{ success: boolean }> {
    const result = await this.clientRepository.delete({
      id: command.clientId,
      organizationId: command.organizationId,
    });
    if (!result.affected) {
      throw new NotFoundException('Client not found');
    }
    return { success: true };
  }
}
