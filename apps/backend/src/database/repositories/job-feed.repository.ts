import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { JobFeedEntity } from '../entities';

@Injectable()
export class JobFeedRepository extends Repository<JobFeedEntity> {
  constructor(private dataSource: DataSource) {
    super(JobFeedEntity, dataSource.createEntityManager());
  }
}
