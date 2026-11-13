import { Injectable } from '@nestjs/common';
import {
  ClientRepository,
  JobRepository,
  UserRepository,
} from '@db/repositories';
import { CustomFieldEntityType, JobStatus } from '@db/enums';
import { pickDefined } from '@shared/helpers/pick-defined';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import { CustomFieldValidator } from '@shared/services/custom-field-validator.service';
import {
  assertJobReferences,
  normalizeScreeningQuestions,
  uniqueIds,
} from '../job-validation';
import { BillingEntitlementsService } from '@modules/billing/core/billing-entitlements.service';
import { GetJob } from '../get-job/get-job.usecase';
import { CreateJobCommand } from './create-job.command';

@Injectable()
export class CreateJob {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly clientRepository: ClientRepository,
    private readonly userRepository: UserRepository,
    private readonly getJob: GetJob,
    private readonly atsSettingsService: AtsSettingsService,
    private readonly customFieldValidator: CustomFieldValidator,
    private readonly entitlements: BillingEntitlementsService,
  ) {}

  async execute(command: CreateJobCommand) {
    const { customFields, hiringTeamIds, ...payload } = pickDefined(
      command.payload,
    );
    await assertJobReferences(
      this.clientRepository,
      this.userRepository,
      command.organizationId,
      { ...payload, hiringTeamIds },
    );
    const [settings, customFieldValues] = await Promise.all([
      this.atsSettingsService.get(command.organizationId),
      this.customFieldValidator.validate(
        command.organizationId,
        CustomFieldEntityType.JOB,
        customFields,
      ),
    ]);

    const status = payload.status ?? JobStatus.DRAFT;
    if (this.entitlements.isActiveJobStatus(status)) {
      await this.entitlements.assertActiveJobCapacity(command.organizationId);
    }
    const reference = await this.jobRepository.nextReference(
      command.organizationId,
    );

    const job = await this.jobRepository.save(
      this.jobRepository.create({
        ...payload,
        currency: payload.currency ?? settings.defaultCurrency,
        hiringTeamIds: uniqueIds(hiringTeamIds ?? []),
        customFields: customFieldValues,
        screeningQuestions: normalizeScreeningQuestions(
          payload.screeningQuestions ?? [],
        ),
        reference,
        status,
        publishedAt: status === JobStatus.PUBLISHED ? new Date() : null,
        ownerId: payload.ownerId ?? command.userId,
        organizationId: command.organizationId,
      }),
    );

    return this.getJob.execute(job.id, command.organizationId);
  }
}
