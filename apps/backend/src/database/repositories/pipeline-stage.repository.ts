import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PipelineStageEntity } from '../entities';

@Injectable()
export class PipelineStageRepository extends Repository<PipelineStageEntity> {
  constructor(private dataSource: DataSource) {
    super(PipelineStageEntity, dataSource.createEntityManager());
  }
}
