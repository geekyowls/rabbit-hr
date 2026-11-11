import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationRepository } from '@db/repositories';
import { buildApplicationQuery } from '../application-query';

@Injectable()
export class GetApplication {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async execute(applicationId: string, organizationId: string) {
    const application = await buildApplicationQuery(
      this.applicationRepository,
      organizationId,
    )
      .andWhere('application.id = :applicationId', { applicationId })
      .getOne();
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }
}
