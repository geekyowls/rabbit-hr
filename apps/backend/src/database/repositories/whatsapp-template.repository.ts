import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { WhatsappTemplateEntity } from '../entities';

@Injectable()
export class WhatsappTemplateRepository extends Repository<WhatsappTemplateEntity> {
  constructor(private dataSource: DataSource) {
    super(WhatsappTemplateEntity, dataSource.createEntityManager());
  }
}
