import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  ActivityRepository,
  JobRepository,
  OrganizationRepository,
} from '@db/repositories';
import {
  ApplicationEntity,
  CandidateDocumentEntity,
  CandidateEntity,
} from '@db/entities';
import {
  ActivityType,
  CandidateSource,
  CustomFieldEntityType,
  DocumentType,
} from '@db/enums';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';
import { CustomFieldValidator } from '@shared/services/custom-field-validator.service';
import {
  buildOpenJobsQuery,
  CAREERS_JOB_DETAIL_SELECT,
  findCareersOrganization,
} from '../careers-query';
import { ApplyToJobCommand } from './apply-to-job.command';

const CV_MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

@Injectable()
export class ApplyToJob {
  constructor(
    private readonly dataSource: DataSource,
    private readonly organizationRepository: OrganizationRepository,
    private readonly jobRepository: JobRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly pipelineStageService: PipelineStageService,
    private readonly customFieldValidator: CustomFieldValidator,
  ) {}

  async execute(command: ApplyToJobCommand) {
    const { payload } = command;
    const organization = await findCareersOrganization(
      this.organizationRepository,
      command.orgSlug,
    );
    const organizationId = organization.id;

    const job = await buildOpenJobsQuery(
      this.jobRepository,
      organizationId,
      CAREERS_JOB_DETAIL_SELECT,
    )
      .andWhere('job.id = :jobId', { jobId: command.jobId })
      .getOne();
    if (!job) {
      throw new NotFoundException('This role is no longer open');
    }

    if (
      payload.cvFileKey &&
      !payload.cvFileKey.startsWith(`organizations/${organizationId}/careers/`)
    ) {
      throw new BadRequestException('Invalid CV upload');
    }

    const answersById = new Map(
      (payload.answers ?? []).map((a) => [a.questionId, a.answer.trim()]),
    );
    const missing = job.screeningQuestions.filter(
      (q) => q.required && !answersById.get(q.id),
    );
    if (missing.length > 0) {
      throw new BadRequestException(
        `Please answer: ${missing.map((q) => q.question).join(', ')}`,
      );
    }
    const answers = job.screeningQuestions
      .filter((q) => answersById.get(q.id))
      .map((q) => ({
        questionId: q.id,
        question: q.question,
        answer: answersById.get(q.id)!,
      }));

    const now = new Date();
    const email = payload.email.toLowerCase();
    const initialStage =
      await this.pipelineStageService.getInitialStage(organizationId);
    const submittedCustomFields = await this.customFieldValidator.validate(
      organizationId,
      CustomFieldEntityType.CANDIDATE,
      payload.customFields,
      { careersOnly: true },
    );

    await this.dataSource.transaction(async (manager) => {
      const candidates = manager.getRepository(CandidateEntity);
      const applications = manager.getRepository(ApplicationEntity);

      let candidate = await candidates.findOne({
        where: { organizationId, email },
      });
      const isNewCandidate = !candidate;

      if (candidate) {
        const existing = await applications.exists({
          where: { candidateId: candidate.id, jobId: job.id },
        });
        if (existing) {
          throw new ConflictException('You have already applied for this role');
        }
        candidate.firstName = payload.firstName;
        candidate.lastName = payload.lastName;
        candidate.phone = payload.phone ?? candidate.phone;
        candidate.location = payload.location ?? candidate.location;
        candidate.linkedinUrl = payload.linkedinUrl ?? candidate.linkedinUrl;
        candidate.gdprConsentAt = now;
        candidate.customFields = {
          ...candidate.customFields,
          ...submittedCustomFields,
        };
        if (payload.cvFileKey) {
          candidate.cvFileKey = payload.cvFileKey;
          candidate.cvFileName = payload.cvFileName ?? null;
        }
        candidate = await candidates.save(candidate);
      } else {
        candidate = await candidates.save(
          candidates.create({
            organizationId,
            firstName: payload.firstName,
            lastName: payload.lastName,
            email,
            phone: payload.phone ?? null,
            location: payload.location ?? null,
            linkedinUrl: payload.linkedinUrl ?? null,
            cvFileKey: payload.cvFileKey ?? null,
            cvFileName: payload.cvFileName ?? null,
            source: CandidateSource.CAREERS_PAGE,
            gdprConsentAt: now,
            customFields: submittedCustomFields,
            ownerId: job.ownerId,
          }),
        );
      }

      const application = await applications.save(
        applications.create({
          organizationId,
          candidateId: candidate.id,
          jobId: job.id,
          stage: initialStage.key,
          source: CandidateSource.CAREERS_PAGE,
          answers,
          appliedAt: now,
          stageChangedAt: now,
          ownerId: job.ownerId,
        }),
      );

      const base = {
        organizationId,
        candidateId: candidate.id,
        applicationId: application.id,
        jobId: job.id,
        clientId: job.clientId,
        actorId: null,
      };

      if (isNewCandidate) {
        await this.activityRepository.record(
          {
            ...base,
            applicationId: null,
            jobId: null,
            clientId: null,
            type: ActivityType.CREATED,
            title: 'Candidate added from careers page',
          },
          manager,
        );
      }
      await this.activityRepository.record(
        {
          ...base,
          type: ActivityType.CREATED,
          title: `Applied for ${job.title} via careers page`,
          metadata: { source: CandidateSource.CAREERS_PAGE },
        },
        manager,
      );
      if (payload.coverNote?.trim()) {
        await this.activityRepository.record(
          {
            ...base,
            type: ActivityType.NOTE,
            title: 'Cover note',
            body: payload.coverNote.trim(),
          },
          manager,
        );
      }

      if (payload.cvFileKey) {
        const extension =
          payload.cvFileKey.split('.').pop()?.toLowerCase() ?? '';
        const document = await manager.save(
          manager.create(CandidateDocumentEntity, {
            organizationId,
            candidateId: candidate.id,
            applicationId: application.id,
            type: DocumentType.CV,
            name: 'CV',
            fileKey: payload.cvFileKey,
            fileName: payload.cvFileName ?? `cv.${extension}`,
            mimeType: CV_MIME_TYPES[extension] ?? null,
          }),
        );
        await this.activityRepository.record(
          {
            ...base,
            type: ActivityType.DOCUMENT,
            title: 'CV uploaded',
            metadata: {
              documentId: document.id,
              documentType: DocumentType.CV,
            },
          },
          manager,
        );
      }
    });

    return { applied: true, jobTitle: job.title };
  }
}
