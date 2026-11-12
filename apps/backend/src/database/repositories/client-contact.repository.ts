import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ClientContactEntity } from '../entities';

@Injectable()
export class ClientContactRepository extends Repository<ClientContactEntity> {
  constructor(private dataSource: DataSource) {
    super(ClientContactEntity, dataSource.createEntityManager());
  }
}
