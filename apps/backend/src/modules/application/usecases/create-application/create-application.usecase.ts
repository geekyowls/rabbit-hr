import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  ActivityRepository,
  ApplicationRepository,
  CandidateRepository,
  JobRepository,
  UserRepository,
} from '@db/repositories';
import { ActivityType } from '@db/enums';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';
import { GetApplication } from '../get-application/get-application.usecase';
import { CreateApplicationCommand } from './create-application.command';

@Injectable()
export class CreateApplication {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly jobRepository: JobRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly userRepository: UserRepository,
    private readonly getApplication: GetApplication,
    private readonly pipelineStageService: PipelineStageService,
  ) {}

  async execute(command: CreateApplicationCommand) {
    const [candidate, job] = await Promise.all([
      this.candidateRepository.findOne({
        where: {
          id: command.candidateId,
          organizationId: command.organizationId,
        },
        select: ['id', 'firstName', 'lastName', 'source'],
      }),
      this.jobRepository.findOne({
        where: { id: command.jobId, organizationId: command.organizationId },
        select: ['id', 'title', 'clientId'],
      }),
    ]);
    if (!candidate) throw new BadRequestException('Candidate not found');
    if (!job) throw new BadRequestException('Job not found');
    await this.userRepository.assertInOrganization(
      command.ownerId,
      command.organizationId,
    );

    const stage = command.stage
      ? await this.pipelineStageService.getStage(
          command.organizationId,
          command.stage,
        )
      : await this.pipelineStageService.getInitialStage(command.organizationId);

    const exists = await this.applicationRepository.exists({
      where: { candidateId: candidate.id, jobId: job.id },
    });
    if (exists) {
      throw new ConflictException(
        'This candidate has already been added to this job',
      );
    }

    const now = new Date();
    const application = await this.applicationRepository.save(
      this.applicationRepository.create({
        organizationId: command.organizationId,
        candidateId: candidate.id,
        jobId: job.id,
        stage: stage.key,
        source: command.source ?? candidate.source,
        ownerId: command.ownerId ?? command.userId,
        appliedAt: now,
        stageChangedAt: now,
      }),
    );

    await this.activityRepository.record({
      organizationId: command.organizationId,
      candidateId: candidate.id,
      applicationId: application.id,
      jobId: job.id,
      clientId: job.clientId,
      type: ActivityType.CREATED,
      title: `${candidate.firstName} ${candidate.lastName} added to ${job.title}`,
      metadata: { stage: application.stage },
      actorId: command.userId,
    });

    return this.getApplication.execute(application.id, command.organizationId);
  }
}
