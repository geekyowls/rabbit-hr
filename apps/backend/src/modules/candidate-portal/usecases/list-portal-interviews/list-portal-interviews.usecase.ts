import { Injectable } from '@nestjs/common';
import {
  InterviewBookingLinkRepository,
  InterviewRepository,
} from '@db/repositories';
import { listPortalBookingLinks, listPortalInterviews } from '../portal-query';
import { PortalCandidateCommand } from '../portal-candidate.command';

@Injectable()
export class ListPortalInterviews {
  constructor(
    private readonly interviewRepository: InterviewRepository,
    private readonly bookingLinkRepository: InterviewBookingLinkRepository,
  ) {}

  async execute(command: PortalCandidateCommand) {
    const scope = {
      candidateId: command.candidateId,
      organizationId: command.organizationId,
    };
    const [interviews, bookingLinks] = await Promise.all([
      listPortalInterviews(this.interviewRepository, scope),
      listPortalBookingLinks(this.bookingLinkRepository, scope),
    ]);
    return {
      upcoming: interviews.filter((i) => i.isUpcoming),
      past: interviews.filter((i) => !i.isUpcoming).reverse(),
      bookingLinks,
    };
  }
}
