import { Injectable } from '@nestjs/common';
import { calculateSkip, createPaginationMetadata } from '@boilerplate/core';
import {
  InterviewRepository,
  ScorecardRepository,
  UserRepository,
} from '@db/repositories';
import {
  buildInterviewQuery,
  FEEDBACK_DUE_CLAUSE,
  hydrateInterviews,
} from '../interview-query';
import { ListInterviewsCommand } from './list-interviews.command';

const LINK_COLUMNS = ['jobId', 'candidateId', 'applicationId'] as const;

@Injectable()
export class ListInterviews {
  constructor(
    private readonly interviewRepository: InterviewRepository,
    private readonly scorecardRepository: ScorecardRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: ListInterviewsCommand) {
    const qb = buildInterviewQuery(
      this.interviewRepository,
      command.organizationId,
    );

    if (command.from) {
      qb.andWhere('interview.scheduledAt >= :from', {
        from: new Date(command.from),
      });
    }
    if (command.to) {
      qb.andWhere('interview.scheduledAt <= :to', { to: new Date(command.to) });
    }
    if (command.status) {
      qb.andWhere('interview.status = :status', { status: command.status });
    }
    for (const column of LINK_COLUMNS) {
      const value = command[column];
      if (value) {
        qb.andWhere(`interview.${column} = :${column}`, { [column]: value });
      }
    }
    if (command.interviewerId) {
      qb.andWhere(':interviewerId = ANY(interview.interviewerIds)', {
        interviewerId: command.interviewerId,
      });
    }
    if (command.mine) {
      qb.andWhere(
        '(interview.organizerId = :currentUserId OR :currentUserId = ANY(interview.interviewerIds))',
        { currentUserId: command.userId },
      );
    }
    if (command.needsFeedback) {
      qb.andWhere(FEEDBACK_DUE_CLAUSE);
    }

    qb.orderBy('interview.scheduledAt', command.from ? 'ASC' : 'DESC')
      .addOrderBy('interview.createdAt', 'DESC')
      .skip(calculateSkip(command.page, command.limit))
      .take(command.limit);

    const [interviews, total] = await qb.getManyAndCount();
    const data = await hydrateInterviews(
      {
        interviewRepository: this.interviewRepository,
        scorecardRepository: this.scorecardRepository,
        userRepository: this.userRepository,
      },
      command.organizationId,
      interviews,
    );

    return {
      data,
      ...createPaginationMetadata(command.page, command.limit, total),
    };
  }
}
