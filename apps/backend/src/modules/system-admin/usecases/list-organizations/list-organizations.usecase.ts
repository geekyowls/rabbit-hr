import { Injectable } from '@nestjs/common';

import {
  OrganizationRepository,
  UserRepository,
} from '@db/repositories';
import { calculateSkip, createPaginationMetadata } from '@boilerplate/core';

import { ListOrganizationsCommand } from './list-organizations.command';

@Injectable()
export class ListOrganizations {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: ListOrganizationsCommand) {
    const skip = calculateSkip(command.page, command.limit);

    const queryBuilder = this.organizationRepository
      .createQueryBuilder('org')
      .where('org.isSystemOrg = :isSystemOrg', { isSystemOrg: false })
      .select([
        'org.id',
        'org.name',
        'org.slug',
        'org.domain',
        'org.status',
        'org.logo',
        'org.email',
        'org.phone',
        'org.subscriptionStatus',
        'org.trialEndsAt',
        'org.subscriptionEndsAt',
        'org.createdAt',
        'org.updatedAt',
      ]);

    if (command.status) {
      queryBuilder.andWhere('org.status = :status', { status: command.status });
    }

    if (command.subscriptionStatus) {
      queryBuilder.andWhere('org.subscriptionStatus = :subscriptionStatus', {
        subscriptionStatus: command.subscriptionStatus,
      });
    }

    if (command.search) {
      queryBuilder.andWhere(
        '(org.name ILIKE :search OR org.slug ILIKE :search OR org.email ILIKE :search)',
        { search: `%${command.search}%` },
      );
    }

    queryBuilder.skip(skip).take(command.limit);
    queryBuilder.orderBy('org.createdAt', 'DESC');

    const [organizations, total] = await queryBuilder.getManyAndCount();

    const organizationsWithUserCount = await Promise.all(
      organizations.map(async (org) => {
        const userCount = await this.userRepository.count({
          where: { organizationId: org.id },
        });
        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          domain: org.domain,
          status: org.status,
          logo: org.logo,
          email: org.email,
          phone: org.phone,
          subscriptionStatus: org.subscriptionStatus,
          trialEndsAt: org.trialEndsAt,
          subscriptionEndsAt: org.subscriptionEndsAt,
          userCount,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,
        };
      }),
    );

    return {
      data: organizationsWithUserCount,
      ...createPaginationMetadata(command.page, command.limit, total),
    };
  }
}
