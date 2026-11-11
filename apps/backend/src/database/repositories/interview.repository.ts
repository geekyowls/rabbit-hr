import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InterviewEntity } from '../entities';

@Injectable()
export class InterviewRepository extends Repository<InterviewEntity> {
  constructor(private dataSource: DataSource) {
    super(InterviewEntity, dataSource.createEntityManager());
  }
}
