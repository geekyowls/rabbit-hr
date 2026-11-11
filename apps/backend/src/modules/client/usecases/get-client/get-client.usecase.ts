import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientContactRepository, ClientRepository } from '@db/repositories';
import { safeUserSelect } from '@shared/helpers/safe-user-select';

@Injectable()
export class GetClient {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly clientContactRepository: ClientContactRepository,
  ) {}

  async execute(clientId: string, organizationId: string) {
    const client = await this.clientRepository
      .createQueryBuilder('client')
      .leftJoin('client.owner', 'owner')
      .addSelect(safeUserSelect('owner'))
      .where('client.id = :clientId', { clientId })
      .andWhere('client.organizationId = :organizationId', { organizationId })
      .getOne();

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const [contacts, stats] = await Promise.all([
      this.clientContactRepository.find({
        where: { clientId, organizationId },
        order: { isPrimary: 'DESC', firstName: 'ASC' },
      }),
      this.clientRepository.getStats(organizationId, [clientId]),
    ]);

    return { ...client, ...stats.get(clientId)!, contacts };
  }
}
