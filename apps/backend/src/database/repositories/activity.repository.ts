import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { ActivityEntity } from '../entities';

@Injectable()
export class ActivityRepository extends Repository<ActivityEntity> {
  constructor(private dataSource: DataSource) {
    super(ActivityEntity, dataSource.createEntityManager());
  }

  async record(
    data: DeepPartial<ActivityEntity>,
    manager?: EntityManager,
  ): Promise<ActivityEntity> {
    const repo = manager ? manager.getRepository(ActivityEntity) : this;
    return repo.save(repo.create(data));
  }
}
