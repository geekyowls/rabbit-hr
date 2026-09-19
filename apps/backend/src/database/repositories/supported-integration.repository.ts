import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportedIntegrationEntity } from '../entities/supported-integration.entity';
import { IntegrationCategory } from '../enums';

@Injectable()
export class SupportedIntegrationRepository extends Repository<SupportedIntegrationEntity> {
  constructor(
    @InjectRepository(SupportedIntegrationEntity)
    private readonly repository: Repository<SupportedIntegrationEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findAllActive(): Promise<SupportedIntegrationEntity[]> {
    return this.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findByProvider(
    provider: string,
  ): Promise<SupportedIntegrationEntity | null> {
    return this.findOne({ where: { provider, isActive: true } });
  }

  async findByCategory(
    category: IntegrationCategory,
  ): Promise<SupportedIntegrationEntity[]> {
    return this.find({
      where: { category, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }
}
