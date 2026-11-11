import { Injectable, NotFoundException } from '@nestjs/common';
import { Not } from 'typeorm';
import { ClientContactRepository } from '@db/repositories';
import { ClientContactEntity } from '@db/entities';
import { pickDefined } from '@shared/helpers/pick-defined';
import { UpdateClientContactCommand } from './update-client-contact.command';

@Injectable()
export class UpdateClientContact {
  constructor(
    private readonly clientContactRepository: ClientContactRepository,
  ) {}

  async execute(
    command: UpdateClientContactCommand,
  ): Promise<ClientContactEntity> {
    const contact = await this.clientContactRepository.findOne({
      where: {
        id: command.contactId,
        clientId: command.clientId,
        organizationId: command.organizationId,
      },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (command.payload.isPrimary) {
      await this.clientContactRepository.update(
        {
          clientId: command.clientId,
          organizationId: command.organizationId,
          id: Not(contact.id),
        },
        { isPrimary: false },
      );
    }

    Object.assign(contact, pickDefined(command.payload));
    return this.clientContactRepository.save(contact);
  }
}
