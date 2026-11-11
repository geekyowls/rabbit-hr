import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InterviewBookingLinkEntity } from '../entities';

@Injectable()
export class InterviewBookingLinkRepository extends Repository<InterviewBookingLinkEntity> {
  constructor(private dataSource: DataSource) {
    super(InterviewBookingLinkEntity, dataSource.createEntityManager());
  }
}
