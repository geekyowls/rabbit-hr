import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EmailTemplateEntity } from '../entities';

@Injectable()
export class EmailTemplateRepository extends Repository<EmailTemplateEntity> {
  constructor(private dataSource: DataSource) {
    super(EmailTemplateEntity, dataSource.createEntityManager());
  }
}
