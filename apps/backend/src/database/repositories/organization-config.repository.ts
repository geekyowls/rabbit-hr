import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationConfigEntity } from '../entities/organization-config.entity';
import { OrganizationConfigType } from '../enums';

@Injectable()
export class OrganizationConfigRepository extends Repository<OrganizationConfigEntity> {
  constructor(
    @InjectRepository(OrganizationConfigEntity)
    private readonly repository: Repository<OrganizationConfigEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findById(id: string): Promise<OrganizationConfigEntity | null> {
    return this.findOne({ where: { id } });
  }

  async findByOrganizationId(
    organizationId: string,
  ): Promise<OrganizationConfigEntity[]> {
    return this.find({
      where: { organizationId },
      order: { type: 'ASC', name: 'ASC' },
    });
  }

  async findByOrganizationIdAndType(
    organizationId: string,
    type: OrganizationConfigType,
  ): Promise<OrganizationConfigEntity[]> {
    return this.find({
      where: { organizationId, type },
      order: { name: 'ASC' },
    });
  }

  async findByIds(ids: string[]): Promise<OrganizationConfigEntity[]> {
    if (ids.length === 0) return [];
    return this.createQueryBuilder('config')
      .where('config.id IN (:...ids)', { ids })
      .getMany();
  }
}
