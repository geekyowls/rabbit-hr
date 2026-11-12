import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Not } from 'typeorm';
import { CandidateRepository, UserRepository } from '@db/repositories';
import { CustomFieldEntityType } from '@db/enums';
import { pickDefined } from '@shared/helpers/pick-defined';
import { CustomFieldValidator } from '@shared/services/custom-field-validator.service';
import { GetCandidate } from '../get-candidate/get-candidate.usecase';
import { UpdateCandidateCommand } from './update-candidate.command';

@Injectable()
export class UpdateCandidate {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly userRepository: UserRepository,
    private readonly getCandidate: GetCandidate,
    private readonly customFieldValidator: CustomFieldValidator,
  ) {}

  async execute(command: UpdateCandidateCommand) {
    const candidate = await this.candidateRepository.findOne({
      where: {
        id: command.candidateId,
        organizationId: command.organizationId,
      },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const { gdprConsentAt, email, customFields, ...rest } = pickDefined(
      command.payload,
    );

    if (email && email.toLowerCase() !== candidate.email) {
      const duplicate = await this.candidateRepository.exists({
        where: {
          organizationId: command.organizationId,
          email: email.toLowerCase(),
          id: Not(candidate.id),
        },
      });
      if (duplicate) {
        throw new ConflictException(
          'A candidate with this email already exists',
        );
      }
      candidate.email = email.toLowerCase();
    }
    await this.userRepository.assertInOrganization(
      rest.ownerId,
      command.organizationId,
    );

    if (customFields !== undefined) {
      candidate.customFields = await this.customFieldValidator.validate(
        command.organizationId,
        CustomFieldEntityType.CANDIDATE,
        customFields,
        { existing: candidate.customFields },
      );
    }

    Object.assign(candidate, rest);
    if (gdprConsentAt !== undefined) {
      candidate.gdprConsentAt = gdprConsentAt ? new Date(gdprConsentAt) : null;
    }

    await this.candidateRepository.save(candidate);
    return this.getCandidate.execute(candidate.id, command.organizationId);
  }
}
