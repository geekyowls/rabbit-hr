import { Injectable } from '@nestjs/common';
import {
  ApplicationRepository,
  CandidateDocumentRepository,
  InterviewBookingLinkRepository,
  InterviewRepository,
  OfferRepository,
} from '@db/repositories';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';
import {
  listDocumentRequests,
  listPortalApplicationRows,
  listPortalBookingLinks,
  listPortalInterviews,
  listPortalOffers,
  stageCategories,
  toPortalApplication,
} from '../portal-query';
import { PortalCandidateCommand } from '../portal-candidate.command';

const UPCOMING_LIMIT = 5;

@Injectable()
export class GetPortalOverview {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly documentRepository: CandidateDocumentRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly offerRepository: OfferRepository,
    private readonly bookingLinkRepository: InterviewBookingLinkRepository,
    private readonly pipelineStageService: PipelineStageService,
  ) {}

  async execute(command: PortalCandidateCommand) {
    const scope = {
      candidateId: command.candidateId,
      organizationId: command.organizationId,
    };
    const [categories, rows, interviews, offers, bookingLinks] =
      await Promise.all([
        stageCategories(this.pipelineStageService, scope.organizationId),
        listPortalApplicationRows(
          this.applicationRepository,
          scope.candidateId,
          scope.organizationId,
        ),
        listPortalInterviews(this.interviewRepository, scope),
        listPortalOffers(this.offerRepository, scope),
        listPortalBookingLinks(this.bookingLinkRepository, scope),
      ]);
    const applications = rows
      .map((row) => toPortalApplication(row, categories))
      .sort((a, b) => Number(a.isClosed) - Number(b.isClosed));
    const documentRequests = await listDocumentRequests(
      this.documentRepository,
      rows,
      categories,
      scope.candidateId,
      scope.organizationId,
    );
    return {
      applications,
      upcomingInterviews: interviews
        .filter((i) => i.isUpcoming)
        .slice(0, UPCOMING_LIMIT),
      pendingOffers: offers.filter((o) => o.signStatus === 'pending'),
      documentRequests,
      bookingLinks,
    };
  }
}
