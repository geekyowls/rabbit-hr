import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Not } from 'typeorm';
import { CandidateRepository, UserRepository } from '@db/repositories';
import { pickDefined } from '@shared/helpers/pick-defined';
import { GetCandidate } from '../get-candidate/get-candidate.usecase';
import { UpdateCandidateCommand } from './update-candidate.command';

@Injectable()
export class UpdateCandidate {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly userRepository: UserRepository,
    private readonly getCandidate: GetCandidate,
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

    const { gdprConsentAt, email, ...rest } = pickDefined(command.payload);

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

    Object.assign(candidate, rest);
    if (gdprConsentAt !== undefined) {
      candidate.gdprConsentAt = gdprConsentAt ? new Date(gdprConsentAt) : null;
    }

    await this.candidateRepository.save(candidate);
    return this.getCandidate.execute(candidate.id, command.organizationId);
  }
}
