import { Injectable, NotFoundException } from '@nestjs/common';
import { JobRepository, OrganizationRepository } from '@db/repositories';
import { CustomFieldEntityType } from '@db/enums';
import { CustomFieldValidator } from '@shared/services/custom-field-validator.service';
import {
  buildOpenJobsQuery,
  CAREERS_JOB_DETAIL_SELECT,
  findCareersOrganization,
} from '../careers-query';
import { GetCareersJobCommand } from './get-careers-job.command';

@Injectable()
export class GetCareersJob {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly jobRepository: JobRepository,
    private readonly customFieldValidator: CustomFieldValidator,
  ) {}

  async execute(command: GetCareersJobCommand) {
    const organization = await findCareersOrganization(
      this.organizationRepository,
      command.orgSlug,
    );
    const job = await buildOpenJobsQuery(
      this.jobRepository,
      organization.id,
      CAREERS_JOB_DETAIL_SELECT,
    )
      .andWhere('job.id = :jobId', { jobId: command.jobId })
      .getOne();
    if (!job) {
      throw new NotFoundException('This role is no longer open');
    }
    const definitions = await this.customFieldValidator.getActiveDefinitions(
      organization.id,
      CustomFieldEntityType.CANDIDATE,
      true,
    );
    const { ownerId: _ownerId, clientId: _clientId, ...publicJob } = job;
    return {
      ...publicJob,
      customFields: definitions.map((d) => ({
        key: d.key,
        label: d.label,
        type: d.type,
        options: d.options,
        required: d.required,
      })),
    };
  }
}
