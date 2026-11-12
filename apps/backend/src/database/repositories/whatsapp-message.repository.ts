import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { WhatsappMessageEntity } from '../entities';

@Injectable()
export class WhatsappMessageRepository extends Repository<WhatsappMessageEntity> {
  constructor(private dataSource: DataSource) {
    super(WhatsappMessageEntity, dataSource.createEntityManager());
  }
}
