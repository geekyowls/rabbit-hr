import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserTimeOffEntity } from '../entities';

@Injectable()
export class UserTimeOffRepository extends Repository<UserTimeOffEntity> {
  constructor(private dataSource: DataSource) {
    super(UserTimeOffEntity, dataSource.createEntityManager());
  }
}
