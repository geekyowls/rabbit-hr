import { Injectable } from '@nestjs/common';
import { OrganizationAtsSettings, resolveAtsSettings } from '@db/entities';
import { OrganizationRepository } from '@db/repositories';

@Injectable()
export class AtsSettingsService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async get(organizationId: string): Promise<OrganizationAtsSettings> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      select: ['id', 'atsSettings'],
    });
    return resolveAtsSettings(organization?.atsSettings);
  }
}
