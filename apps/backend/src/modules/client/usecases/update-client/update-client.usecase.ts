import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientRepository, UserRepository } from '@db/repositories';
import { pickDefined } from '@shared/helpers/pick-defined';
import { GetClient } from '../get-client/get-client.usecase';
import { UpdateClientCommand } from './update-client.command';

@Injectable()
export class UpdateClient {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly userRepository: UserRepository,
    private readonly getClient: GetClient,
  ) {}

  async execute(command: UpdateClientCommand) {
    const client = await this.clientRepository.findOne({
      where: { id: command.clientId, organizationId: command.organizationId },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const { address, billing, ...rest } = pickDefined(command.payload);
    await this.userRepository.assertInOrganization(
      rest.ownerId,
      command.organizationId,
    );

    Object.assign(client, rest);
    if (address !== undefined) {
      client.address = address
        ? { ...client.address, ...pickDefined(address) }
        : null;
    }
    if (billing !== undefined) {
      client.billing = billing
        ? { ...client.billing, ...pickDefined(billing) }
        : null;
    }

    await this.clientRepository.save(client);
    return this.getClient.execute(client.id, command.organizationId);
  }
}
