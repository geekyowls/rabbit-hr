import { ConflictException, Injectable } from '@nestjs/common';
import {
  ActivityRepository,
  CandidateRepository,
  UserRepository,
} from '@db/repositories';
import { ActivityType, CustomFieldEntityType } from '@db/enums';
import { CustomFieldValidator } from '@shared/services/custom-field-validator.service';
import { pickDefined } from '@shared/helpers/pick-defined';
import { GetCandidate } from '../get-candidate/get-candidate.usecase';
import { CreateCandidateCommand } from './create-candidate.command';

@Injectable()
export class CreateCandidate {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly userRepository: UserRepository,
    private readonly getCandidate: GetCandidate,
    private readonly customFieldValidator: CustomFieldValidator,
  ) {}

  async execute(command: CreateCandidateCommand) {
    const { gdprConsentAt, customFields, ...payload } = pickDefined(
      command.payload,
    );
    const email = command.payload.email.toLowerCase();

    const duplicate = await this.candidateRepository.exists({
      where: { organizationId: command.organizationId, email },
    });
    if (duplicate) {
      throw new ConflictException('A candidate with this email already exists');
    }
    await this.userRepository.assertInOrganization(
      payload.ownerId,
      command.organizationId,
    );
    const customFieldValues = await this.customFieldValidator.validate(
      command.organizationId,
      CustomFieldEntityType.CANDIDATE,
      customFields,
    );

    const candidate = await this.candidateRepository.save(
      this.candidateRepository.create({
        ...payload,
        email,
        customFields: customFieldValues,
        gdprConsentAt: gdprConsentAt ? new Date(gdprConsentAt) : null,
        ownerId: payload.ownerId ?? command.userId,
        organizationId: command.organizationId,
      }),
    );

    await this.activityRepository.record({
      organizationId: command.organizationId,
      candidateId: candidate.id,
      type: ActivityType.CREATED,
      title: 'Candidate added',
      actorId: command.userId,
    });

    return this.getCandidate.execute(candidate.id, command.organizationId);
  }
}
