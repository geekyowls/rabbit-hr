import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class RoleRepository extends Repository<RoleEntity> {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly repository: Repository<RoleEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findById(id: string): Promise<RoleEntity | null> {
    return this.findOne({ where: { id } });
  }

  async findByOrganizationId(organizationId: string): Promise<RoleEntity[]> {
    return this.find({
      where: { organizationId },
      order: { createdAt: 'ASC' },
    });
  }

  async findDefaultRole(organizationId: string): Promise<RoleEntity | null> {
    return this.findOne({ where: { organizationId, isDefault: true } });
  }

  async findDropdownByOrganizationId(
    organizationId: string,
  ): Promise<Array<{ id: string; name: string }>> {
    return this.find({
      where: { organizationId },
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });
  }
}
