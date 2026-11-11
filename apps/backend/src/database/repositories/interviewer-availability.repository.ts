import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InterviewerAvailabilityEntity } from '../entities';

@Injectable()
export class InterviewerAvailabilityRepository extends Repository<InterviewerAvailabilityEntity> {
  constructor(private dataSource: DataSource) {
    super(InterviewerAvailabilityEntity, dataSource.createEntityManager());
  }
}
