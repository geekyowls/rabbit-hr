import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EmailMessageEntity } from '../entities';

@Injectable()
export class EmailMessageRepository extends Repository<EmailMessageEntity> {
  constructor(private dataSource: DataSource) {
    super(EmailMessageEntity, dataSource.createEntityManager());
  }
}
