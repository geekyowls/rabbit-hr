import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EmailThreadEntity } from '../entities';

@Injectable()
export class EmailThreadRepository extends Repository<EmailThreadEntity> {
  constructor(private dataSource: DataSource) {
    super(EmailThreadEntity, dataSource.createEntityManager());
  }
}
