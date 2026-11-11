import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientContactRepository } from '@db/repositories';
import { DeleteClientContactCommand } from './delete-client-contact.command';

@Injectable()
export class DeleteClientContact {
  constructor(
    private readonly clientContactRepository: ClientContactRepository,
  ) {}

  async execute(
    command: DeleteClientContactCommand,
  ): Promise<{ success: boolean }> {
    const result = await this.clientContactRepository.delete({
      id: command.contactId,
      clientId: command.clientId,
      organizationId: command.organizationId,
    });
    if (!result.affected) {
      throw new NotFoundException('Contact not found');
    }
    return { success: true };
  }
}
