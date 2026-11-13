import { Injectable, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import {
  OrganizationRepository,
  RoleRepository,
  UserRepository,
} from '@db/repositories';
import {
  OrganizationStatus,
  OrgSubscriptionStatus,
  UserStatus,
} from '@db/enums';
import { OrganizationEntity, RoleEntity, UserEntity } from '@db/entities';
import {
  ALL_PERMISSIONS,
  EventName,
  OrganizationCreatedEvent,
  PlanId,
} from '@boilerplate/core';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { AuthService } from '@modules/auth/services/auth.service';

import { CreateOrganizationCommand } from './create-organization.command';

@Injectable()
export class CreateOrganization {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly roleRepository: RoleRepository,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly eventEmitter: AppEventEmitter,
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
  ) {}

  async execute(command: CreateOrganizationCommand) {
    const slug = this.generateSlug(command.name);
    const domain = `${slug}.local`;

    const existingOrg = await this.organizationRepository.findOne({
      where: [{ slug }, { domain }],
    });

    if (existingOrg) {
      throw new ConflictException(
        'Organization with this name already exists. Please choose a different name.',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: command.adminEmail.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email already exists in the system.',
      );
    }

    const hashedPassword = await this.authService.hashPassword(
      command.adminPassword,
    );

    const { savedOrg, savedUser } = await this.dataSource.transaction(
      async (manager) => {
        const org = manager.create(OrganizationEntity, {
          name: command.name,
          slug,
          domain,
          status: OrganizationStatus.ACTIVE,
          logo: command.logo ?? null,
          isSystemOrg: false,
          plan: PlanId.FREE,
          subscriptionStatus: OrgSubscriptionStatus.ACTIVE,
        });
        const savedOrg = await manager.save(org);

        const role = manager.create(RoleEntity, {
          name: 'Admin',
          permissions: ALL_PERMISSIONS,
          organizationId: savedOrg.id,
          isDefault: true,
        });
        const savedRole = await manager.save(role);

        const user = manager.create(UserEntity, {
          email: command.adminEmail.toLowerCase(),
          password: hashedPassword,
          firstName: command.adminFirstName || null,
          lastName: command.adminLastName || null,
          organizationId: savedOrg.id,
          roleId: savedRole.id,
          status: UserStatus.ACTIVE,
          isActive: true,
          onboarded: true,
        });
        const savedUser = await manager.save(user);

        return { savedOrg, savedUser };
      },
    );

    const frontendBaseUrl = this.configService.get<string>('FRONTEND_BASE_URL');
    const loginLink = frontendBaseUrl || '';

    this.eventEmitter.emit<OrganizationCreatedEvent>({
      eventName: EventName.ORGANIZATION_CREATED,
      timestamp: new Date(),
      organizationId: savedOrg.id,
      createdBy: command.userId,
      adminUserId: savedUser.id,
      adminPassword: command.adminPassword,
      loginLink,
      triggeredBy: command.userId,
    });

    return {
      organization: {
        id: savedOrg.id,
        name: savedOrg.name,
        slug: savedOrg.slug,
        domain: savedOrg.domain,
        status: savedOrg.status,
      },
      adminUser: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
      },
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }
}
