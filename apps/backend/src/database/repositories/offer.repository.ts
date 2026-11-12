import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { OfferEntity } from '../entities';

@Injectable()
export class OfferRepository extends Repository<OfferEntity> {
  constructor(private dataSource: DataSource) {
    super(OfferEntity, dataSource.createEntityManager());
  }
}
