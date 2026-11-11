import { ConflictException, Injectable } from '@nestjs/common';
import {
  ActivityRepository,
  CandidateRepository,
  UserRepository,
} from '@db/repositories';
import { ActivityType } from '@db/enums';
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
  ) {}

  async execute(command: CreateCandidateCommand) {
    const { gdprConsentAt, ...payload } = pickDefined(command.payload);
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

    const candidate = await this.candidateRepository.save(
      this.candidateRepository.create({
        ...payload,
        email,
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
