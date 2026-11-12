import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ActivityRepository,
  ApplicationRepository,
  InterviewBookingLinkRepository,
  InterviewRepository,
  JobRepository,
  OfferRepository,
} from '@db/repositories';
import { ActivityType, PipelineStageCategory } from '@db/enums';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';
import {
  listPortalApplicationRows,
  listPortalBookingLinks,
  listPortalInterviews,
  listPortalOffers,
  PORTAL_PROGRESS_STEPS,
  PORTAL_STAGE_LABELS,
  stageCategories,
  toPortalApplication,
} from '../portal-query';
import { PortalApplicationCommand } from './portal-application.command';

export type StepState = 'done' | 'current' | 'upcoming';

export interface TimelineStep {
  status: PipelineStageCategory;
  label: string;
  state: StepState;
  reachedAt: Date | null;
}

@Injectable()
export class GetPortalApplication {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly jobRepository: JobRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly offerRepository: OfferRepository,
    private readonly bookingLinkRepository: InterviewBookingLinkRepository,
    private readonly pipelineStageService: PipelineStageService,
  ) {}

  async execute(command: PortalApplicationCommand) {
    const scope = {
      candidateId: command.candidateId,
      organizationId: command.organizationId,
      applicationId: command.applicationId,
    };
    const [row] = await listPortalApplicationRows(
      this.applicationRepository,
      scope.candidateId,
      scope.organizationId,
      scope.applicationId,
    );
    if (!row) {
      throw new NotFoundException('Application not found');
    }

    const [categories, job, changes, interviews, offers, bookingLinks] =
      await Promise.all([
        stageCategories(this.pipelineStageService, scope.organizationId),
        this.jobRepository.findOne({
          where: { id: row.jobId, organizationId: scope.organizationId },
          select: [
            'id',
            'description',
            'salaryMin',
            'salaryMax',
            'payRate',
            'rateUnit',
            'currency',
          ],
        }),
        this.activityRepository.find({
          where: {
            organizationId: scope.organizationId,
            applicationId: scope.applicationId,
            type: ActivityType.STAGE_CHANGE,
          },
          select: ['id', 'metadata', 'createdAt'],
          order: { createdAt: 'ASC' },
        }),
        listPortalInterviews(this.interviewRepository, scope),
        listPortalOffers(this.offerRepository, scope),
        listPortalBookingLinks(this.bookingLinkRepository, scope),
      ]);

    const application = toPortalApplication(row, categories);
    const reached = new Map<PipelineStageCategory, Date>([
      [PipelineStageCategory.APPLIED, row.appliedAt],
    ]);
    for (const change of changes) {
      const to = change.metadata?.to;
      const category = typeof to === 'string' ? categories.get(to) : undefined;
      if (category && !reached.has(category)) {
        reached.set(category, change.createdAt);
      }
    }

    return {
      ...application,
      description: job?.description ?? null,
      salaryMin: job?.salaryMin ?? null,
      salaryMax: job?.salaryMax ?? null,
      payRate: job?.payRate ?? null,
      rateUnit: job?.rateUnit ?? null,
      currency: job?.currency ?? 'USD',
      canWithdraw: !application.isClosed,
      timeline: this.buildTimeline(
        application.status,
        reached,
        row.stageChangedAt,
      ),
      interviews,
      offers,
      bookingLinks,
    };
  }

  private buildTimeline(
    current: PipelineStageCategory,
    reached: Map<PipelineStageCategory, Date>,
    stageChangedAt: Date,
  ): TimelineStep[] {
    const step = (
      status: PipelineStageCategory,
      state: StepState,
    ): TimelineStep => ({
      status,
      label: PORTAL_STAGE_LABELS[status],
      state,
      reachedAt: state === 'upcoming' ? null : (reached.get(status) ?? null),
    });

    const currentIndex = PORTAL_PROGRESS_STEPS.indexOf(current);
    if (currentIndex >= 0) {
      return PORTAL_PROGRESS_STEPS.map((status, index) =>
        step(
          status,
          index < currentIndex
            ? 'done'
            : index === currentIndex
              ? 'current'
              : 'upcoming',
        ),
      );
    }

    const lastReached = PORTAL_PROGRESS_STEPS.reduce(
      (last, status, index) => (reached.has(status) ? index : last),
      0,
    );
    return [
      ...PORTAL_PROGRESS_STEPS.slice(0, lastReached + 1).map((status) =>
        step(status, 'done'),
      ),
      {
        status: current,
        label: PORTAL_STAGE_LABELS[current],
        state: 'current',
        reachedAt: stageChangedAt,
      },
    ];
  }
}
