import { Injectable } from '@nestjs/common';
import { calculateSkip, createPaginationMetadata } from '@boilerplate/core';
import { OfferRepository, UserRepository } from '@db/repositories';
import {
  buildOfferQuery,
  hydrateOffers,
  OFFER_SEARCH_CLAUSE,
} from '../offer-query';
import { ListOffersCommand } from './list-offers.command';

@Injectable()
export class ListOffers {
  constructor(
    private readonly offerRepository: OfferRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: ListOffersCommand) {
    const qb = buildOfferQuery(this.offerRepository, command.organizationId);
    if (command.status) {
      qb.andWhere('offer.status = :status', { status: command.status });
    }
    if (command.jobId) {
      qb.andWhere('offer.jobId = :jobId', { jobId: command.jobId });
    }
    if (command.candidateId) {
      qb.andWhere('offer.candidateId = :candidateId', {
        candidateId: command.candidateId,
      });
    }
    if (command.applicationId) {
      qb.andWhere('offer.applicationId = :applicationId', {
        applicationId: command.applicationId,
      });
    }
    if (command.clientId) {
      qb.andWhere('job.clientId = :clientId', { clientId: command.clientId });
    }
    if (command.search) {
      qb.andWhere(OFFER_SEARCH_CLAUSE, { search: `%${command.search}%` });
    }

    qb.orderBy('offer.updatedAt', 'DESC')
      .skip(calculateSkip(command.page, command.limit))
      .take(command.limit);

    const [offers, total] = await qb.getManyAndCount();
    return {
      data: await hydrateOffers(
        this.userRepository,
        command.organizationId,
        offers,
      ),
      ...createPaginationMetadata(command.page, command.limit, total),
    };
  }
}
