import { BadRequestException, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';
import type { InterviewExternalRefs } from '@boilerplate/core';
import { InterviewEntity, ScorecardEntity } from '@db/entities';
import {
  InterviewRepository,
  ScorecardRepository,
  UserRepository,
} from '@db/repositories';
import { InterviewStatus } from '@db/enums';
import { safeUserSelect } from '@shared/helpers/safe-user-select';

export interface InterviewRepositories {
  interviewRepository: InterviewRepository;
  scorecardRepository: ScorecardRepository;
  userRepository: UserRepository;
}

type UserSummary = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

export const FEEDBACK_DUE_CLAUSE = `(
  "interview"."status" = '${InterviewStatus.COMPLETED}'
  OR ("interview"."status" = '${InterviewStatus.SCHEDULED}' AND "interview"."scheduledAt" + make_interval(mins => "interview"."durationMinutes") < NOW())
) AND EXISTS (
  SELECT 1 FROM unnest("interview"."interviewerIds") AS assigned(id)
  WHERE NOT EXISTS (
    SELECT 1 FROM interview_scorecards sc
    WHERE sc."interviewId" = "interview"."id" AND sc."interviewerId" = assigned.id
  )
)`;

export function buildInterviewQuery(
  interviewRepository: InterviewRepository,
  organizationId: string,
) {
  return interviewRepository
    .createQueryBuilder('interview')
    .innerJoin('interview.candidate', 'candidate')
    .addSelect([
      'candidate.id',
      'candidate.firstName',
      'candidate.lastName',
      'candidate.email',
    ])
    .innerJoin('interview.job', 'job')
    .addSelect(['job.id', 'job.title', 'job.reference', 'job.clientId'])
    .leftJoin('job.client', 'client')
    .addSelect(['client.id', 'client.name'])
    .innerJoin('interview.application', 'application')
    .addSelect(['application.id', 'application.stage'])
    .leftJoin('interview.organizer', 'organizer')
    .addSelect(safeUserSelect('organizer'))
    .where('interview.organizationId = :organizationId', { organizationId });
}

function isPast(interview: InterviewEntity, now: number): boolean {
  return (
    new Date(interview.scheduledAt).getTime() +
      interview.durationMinutes * 60_000 <
    now
  );
}

export async function hydrateInterviews(
  repos: InterviewRepositories,
  organizationId: string,
  interviews: InterviewEntity[],
) {
  if (interviews.length === 0) return [];
  const userIds = [...new Set(interviews.flatMap((i) => i.interviewerIds))];
  const [users, scorecards] = await Promise.all([
    userIds.length > 0
      ? repos.userRepository.find({
          where: { id: In(userIds), organizationId },
          select: ['id', 'firstName', 'lastName', 'email'],
        })
      : Promise.resolve([]),
    repos.scorecardRepository.find({
      where: {
        organizationId,
        interviewId: In(interviews.map((i) => i.id)),
      },
      select: ['id', 'interviewId', 'interviewerId', 'overallRating'],
    }),
  ]);
  const userById = new Map<string, UserSummary>(users.map((u) => [u.id, u]));
  const now = Date.now();

  return interviews.map((interview) => {
    const assigned = new Set(interview.interviewerIds);
    const own = scorecards.filter((s) => s.interviewId === interview.id);
    const fromAssigned = own.filter((s) => assigned.has(s.interviewerId));
    const ratings = own.map((s) => s.overallRating);
    const awaitingFeedback =
      interview.status === InterviewStatus.COMPLETED ||
      (interview.status === InterviewStatus.SCHEDULED &&
        isPast(interview, now));
    const { candidate, job, application, organizer, ...rest } = interview;
    return {
      ...rest,
      candidate,
      job,
      client: job.client ?? null,
      application,
      organizer: organizer ?? null,
      interviewers: interview.interviewerIds
        .map((id) => userById.get(id))
        .filter((u): u is UserSummary => !!u),
      scorecardCount: fromAssigned.length,
      interviewerCount: interview.interviewerIds.length,
      averageRating:
        ratings.length > 0
          ? Math.round(
              (ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10,
            ) / 10
          : null,
      feedbackDue: awaitingFeedback && fromAssigned.length < assigned.size,
    };
  });
}

export async function loadInterviewDetail(
  repos: InterviewRepositories,
  interviewId: string,
  organizationId: string,
) {
  const interview = await buildInterviewQuery(
    repos.interviewRepository,
    organizationId,
  )
    .andWhere('interview.id = :interviewId', { interviewId })
    .getOne();
  if (!interview) {
    throw new NotFoundException('Interview not found');
  }
  const [hydrated] = await hydrateInterviews(repos, organizationId, [
    interview,
  ]);
  const scorecards = await repos.scorecardRepository
    .createQueryBuilder('scorecard')
    .leftJoin('scorecard.interviewer', 'interviewer')
    .addSelect(safeUserSelect('interviewer'))
    .where('scorecard.organizationId = :organizationId', { organizationId })
    .andWhere('scorecard.interviewId = :interviewId', { interviewId })
    .orderBy('scorecard.submittedAt', 'ASC')
    .getMany();
  return {
    ...hydrated,
    scorecards: scorecards.map((s: ScorecardEntity) => ({
      ...s,
      interviewer: s.interviewer ?? null,
    })),
  };
}

export async function loadInterviewEntity(
  interviewRepository: InterviewRepository,
  interviewId: string,
  organizationId: string,
): Promise<InterviewEntity> {
  const interview = await interviewRepository.findOne({
    where: { id: interviewId, organizationId },
  });
  if (!interview) {
    throw new NotFoundException('Interview not found');
  }
  return interview;
}

export function interviewExternalRefs(
  interview: InterviewEntity,
): InterviewExternalRefs {
  return {
    meetingProvider: interview.meetingProvider,
    meetingExternalId: interview.meetingExternalId,
    calendarProvider: interview.calendarProvider,
    externalEventId: interview.externalEventId,
  };
}

export async function assertInterviewers(
  userRepository: UserRepository,
  organizationId: string,
  interviewerIds: string[],
): Promise<void> {
  if (interviewerIds.length === 0) return;
  const count = await userRepository.count({
    where: { id: In(interviewerIds), organizationId },
  });
  if (count !== new Set(interviewerIds).size) {
    throw new BadRequestException(
      'One or more interviewers are not members of this organization',
    );
  }
}
