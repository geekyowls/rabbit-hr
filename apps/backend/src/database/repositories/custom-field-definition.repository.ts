import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CustomFieldDefinitionEntity } from '../entities';

@Injectable()
export class CustomFieldDefinitionRepository extends Repository<CustomFieldDefinitionEntity> {
  constructor(private dataSource: DataSource) {
    super(CustomFieldDefinitionEntity, dataSource.createEntityManager());
  }
}
