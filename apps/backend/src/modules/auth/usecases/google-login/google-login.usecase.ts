import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  ALL_PERMISSIONS,
  EventName,
  UserRegisteredEvent,
  OrganizationCreatedEvent,
  UserLoggedInEvent,
  PlanId,
} from '@boilerplate/core';
import type { UserEntity } from '@db/entities';
import {
  UserRepository,
  OrganizationRepository,
  RoleRepository,
  UserSessionRepository,
} from '@db/repositories';
import { OrgSubscriptionStatus, UserStatus } from '@db/enums';
import { AuthService } from '../../services/auth.service';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { GoogleLoginCommand } from './google-login.command';

import type { GoogleLoginResponseDto } from '../../dtos/google-login.dto';

@Injectable()
export class GoogleLogin {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSessionRepository: UserSessionRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly roleRepository: RoleRepository,
    private readonly authService: AuthService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  async execute(command: GoogleLoginCommand): Promise<GoogleLoginResponseDto> {
    let userInfo: {
      email?: string;
      sub?: string;
      given_name?: string;
      family_name?: string;
    };
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        {
          headers: { Authorization: `Bearer ${command.accessToken}` },
        },
      );
      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }
      userInfo = await response.json();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    const email = userInfo.email?.toLowerCase().trim();
    const googleId = userInfo.sub;
    if (!email || !googleId) {
      throw new UnauthorizedException('Google account email not found');
    }

    const firstName = userInfo.given_name || email.split('@')[0];
    const lastName = userInfo.family_name || null;

    const userByGoogleId = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization')
      .leftJoinAndSelect('user.role', 'role')
      .where(`"user"."metadata"->>'googleId' = :googleId`, { googleId })
      .getOne();

    if (userByGoogleId) {
      if (
        userByGoogleId.status === UserStatus.BLOCKED ||
        userByGoogleId.status === UserStatus.INACTIVE
      ) {
        throw new UnauthorizedException('Account is inactive');
      }
      return this.loginUser(userByGoogleId, false);
    }

    const userByEmail = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email })
      .getOne();

    if (userByEmail) {
      if (userByEmail.status === UserStatus.INVITED) {
        throw new UnauthorizedException(
          'Please accept your invitation first before using Google sign-in',
        );
      }

      if (!userByEmail.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }

      await this.userRepository.update(userByEmail.id, {
        metadata: { ...(userByEmail.metadata || {}), googleId },
      });

      return this.loginUser(userByEmail, false);
    }

    return this.createNewUser(email, googleId, firstName, lastName);
  }

  private async loginUser(
    user: UserEntity,
    isNewUser: boolean,
  ): Promise<GoogleLoginResponseDto> {
    const accessToken = this.authService.generateAccessToken(
      user,
      user.role?.permissions ?? [],
    );
    const { token: refreshToken, jti } =
      this.authService.generateRefreshToken(user);
    const refreshTokenExpires = this.authService.getRefreshTokenExpiry();

    await this.userSessionRepository.createSession({
      userId: user.id,
      organizationId: user.organizationId,
      jti,
      expiresAt: refreshTokenExpires,
    });

    this.eventEmitter.emit<UserLoggedInEvent>({
      eventName: EventName.USER_LOGGED_IN,
      timestamp: new Date(),
      userId: user.id,
      organizationId: user.organizationId,
      triggeredBy: user.id,
    });

    return {
      accessToken,
      refreshToken,
      isSystemOrg: user.organization.isSystemOrg,
      isNewUser,
    };
  }

  private async createNewUser(
    email: string,
    googleId: string,
    firstName: string,
    lastName: string | null,
  ): Promise<GoogleLoginResponseDto> {
    const orgName = `${firstName}'s Workspace`;
    const slug = await this.generateUniqueSlug(orgName);
    const domain = `${slug}.rabbithr.app`;

    const savedUser = await this.userRepository.manager.transaction(
      async (manager) => {
        const organization = manager.create(
          this.organizationRepository.target,
          {
            name: orgName,
            slug,
            domain,
            plan: PlanId.FREE,
            subscriptionStatus: OrgSubscriptionStatus.ACTIVE,
          },
        );
        await manager.save(organization);

        const adminRole = manager.create(this.roleRepository.target, {
          name: 'Admin',
          permissions: ALL_PERMISSIONS,
          organizationId: organization.id,
          isDefault: true,
        });
        const defaultRole = await manager.save(adminRole);

        const user = manager.create(this.userRepository.target, {
          email,
          firstName,
          lastName,
          password: null,
          organizationId: organization.id,
          roleId: defaultRole.id,
          isActive: true,
          status: UserStatus.ACTIVE,
          metadata: { googleId },
        });
        return manager.save(user);
      },
    );

    this.eventEmitter.emit<OrganizationCreatedEvent>({
      eventName: EventName.ORGANIZATION_CREATED,
      timestamp: new Date(),
      organizationId: savedUser.organizationId,
      createdBy: savedUser.id,
      triggeredBy: savedUser.id,
      signupSource: 'free_plan',
    });

    this.eventEmitter.emit<UserRegisteredEvent>({
      eventName: EventName.USER_REGISTERED,
      timestamp: new Date(),
      userId: savedUser.id,
      organizationId: savedUser.organizationId,
      triggeredBy: savedUser.id,
    });

    const userWithRelations = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id = :id', { id: savedUser.id })
      .getOne();

    if (!userWithRelations) {
      throw new UnauthorizedException('Failed to create user account');
    }

    return this.loginUser(userWithRelations, true);
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    let slug = baseSlug || 'org';
    let counter = 0;

    while (true) {
      const existing = await this.organizationRepository.findOne({
        where: { slug },
      });
      if (!existing) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }
}
