import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CandidateDocumentEntity } from '../entities';

@Injectable()
export class CandidateDocumentRepository extends Repository<CandidateDocumentEntity> {
  constructor(private dataSource: DataSource) {
    super(CandidateDocumentEntity, dataSource.createEntityManager());
  }
}
