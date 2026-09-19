import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationIntegrationEntity } from '../entities/organization-integration.entity';

@Injectable()
export class OrganizationIntegrationRepository extends Repository<OrganizationIntegrationEntity> {
  constructor(
    @InjectRepository(OrganizationIntegrationEntity)
    private readonly repository: Repository<OrganizationIntegrationEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByOrganizationId(
    organizationId: string,
  ): Promise<OrganizationIntegrationEntity[]> {
    return this.find({
      where: { organizationId },
      relations: ['supportedIntegration'],
    });
  }

  async findByOrganizationAndIntegration(
    organizationId: string,
    supportedIntegrationId: string,
  ): Promise<OrganizationIntegrationEntity | null> {
    return this.findOne({
      where: { organizationId, supportedIntegrationId },
      relations: ['supportedIntegration'],
    });
  }

  async findByOrganizationAndProvider(
    organizationId: string,
    provider: string,
  ): Promise<OrganizationIntegrationEntity | null> {
    return this.findOne({
      where: {
        organizationId,
        supportedIntegration: { provider },
      },
      relations: ['supportedIntegration'],
    });
  }

  async findByWebhookToken(
    webhookToken: string,
  ): Promise<OrganizationIntegrationEntity | null> {
    return this.findOne({
      where: { webhookToken },
      relations: ['supportedIntegration'],
    });
  }
}
