import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CandidateCallEntity } from '../entities';

@Injectable()
export class CandidateCallRepository extends Repository<CandidateCallEntity> {
  constructor(private dataSource: DataSource) {
    super(CandidateCallEntity, dataSource.createEntityManager());
  }
}
