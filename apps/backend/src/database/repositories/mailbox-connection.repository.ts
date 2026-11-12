import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { MailboxConnectionEntity } from '../entities';

@Injectable()
export class MailboxConnectionRepository extends Repository<MailboxConnectionEntity> {
  constructor(private dataSource: DataSource) {
    super(MailboxConnectionEntity, dataSource.createEntityManager());
  }
}
