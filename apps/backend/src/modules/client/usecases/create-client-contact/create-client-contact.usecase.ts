import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientContactRepository, ClientRepository } from '@db/repositories';
import { ClientContactEntity } from '@db/entities';
import { pickDefined } from '@shared/helpers/pick-defined';
import { CreateClientContactCommand } from './create-client-contact.command';

@Injectable()
export class CreateClientContact {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly clientContactRepository: ClientContactRepository,
  ) {}

  async execute(
    command: CreateClientContactCommand,
  ): Promise<ClientContactEntity> {
    const exists = await this.clientRepository.exists({
      where: { id: command.clientId, organizationId: command.organizationId },
    });
    if (!exists) {
      throw new NotFoundException('Client not found');
    }

    if (command.payload.isPrimary) {
      await this.clientContactRepository.update(
        { clientId: command.clientId, organizationId: command.organizationId },
        { isPrimary: false },
      );
    }

    return this.clientContactRepository.save(
      this.clientContactRepository.create({
        ...pickDefined(command.payload),
        clientId: command.clientId,
        organizationId: command.organizationId,
      }),
    );
  }
}
