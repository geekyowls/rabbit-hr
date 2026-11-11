import { Injectable } from '@nestjs/common';
import { calculateSkip, createPaginationMetadata } from '@boilerplate/core';
import { ClientRepository } from '@db/repositories';
import { safeUserSelect } from '@shared/helpers/safe-user-select';
import { ListClientsCommand } from './list-clients.command';

@Injectable()
export class ListClients {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(command: ListClientsCommand) {
    const qb = this.clientRepository
      .createQueryBuilder('client')
      .leftJoin('client.owner', 'owner')
      .addSelect(safeUserSelect('owner'))
      .where('client.organizationId = :organizationId', {
        organizationId: command.organizationId,
      });

    if (command.status) {
      qb.andWhere('client.status = :status', { status: command.status });
    }

    if (command.search) {
      qb.andWhere(
        `(client.name ILIKE :search OR client.legalName ILIKE :search OR client.industry ILIKE :search OR client.address->>'city' ILIKE :search)`,
        { search: `%${command.search}%` },
      );
    }

    qb.orderBy('client.name', 'ASC')
      .skip(calculateSkip(command.page, command.limit))
      .take(command.limit);

    const [clients, total] = await qb.getManyAndCount();
    const stats = await this.clientRepository.getStats(
      command.organizationId,
      clients.map((c) => c.id),
    );

    return {
      data: clients.map((client) => {
        const { placementCount: _placementCount, ...rest } = stats.get(
          client.id,
        )!;
        return { ...client, ...rest };
      }),
      ...createPaginationMetadata(command.page, command.limit, total),
    };
  }
}
