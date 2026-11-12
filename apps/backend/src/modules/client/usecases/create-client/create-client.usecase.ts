import { Injectable } from '@nestjs/common';
import { ClientRepository, UserRepository } from '@db/repositories';
import { ClientStatus } from '@db/enums';
import { pickDefined } from '@shared/helpers/pick-defined';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import { GetClient } from '../get-client/get-client.usecase';
import { CreateClientCommand } from './create-client.command';

@Injectable()
export class CreateClient {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly userRepository: UserRepository,
    private readonly getClient: GetClient,
    private readonly atsSettingsService: AtsSettingsService,
  ) {}

  async execute(command: CreateClientCommand) {
    const { payload } = command;
    await this.userRepository.assertInOrganization(
      payload.ownerId,
      command.organizationId,
    );

    const settings = await this.atsSettingsService.get(command.organizationId);

    const client = await this.clientRepository.save(
      this.clientRepository.create({
        ...pickDefined(payload),
        address: payload.address ? pickDefined(payload.address) : null,
        billing: payload.billing
          ? {
              currency: settings.defaultCurrency,
              ...pickDefined(payload.billing),
            }
          : null,
        status: payload.status ?? ClientStatus.ACTIVE,
        ownerId: payload.ownerId ?? command.userId,
        organizationId: command.organizationId,
      }),
    );

    return this.getClient.execute(client.id, command.organizationId);
  }
}
