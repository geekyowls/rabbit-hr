import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ScorecardEntity } from '../entities';

@Injectable()
export class ScorecardRepository extends Repository<ScorecardEntity> {
  constructor(private dataSource: DataSource) {
    super(ScorecardEntity, dataSource.createEntityManager());
  }
}
