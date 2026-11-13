import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ALL_PERMISSIONS, PlanId } from '@boilerplate/core';
import {
  EventName,
  UserRegisteredEvent,
  OrganizationCreatedEvent,
  SignupWaitlistJoinedEvent,
} from '@boilerplate/core';
import {
  OrganizationRepository,
  UserRepository,
  RoleRepository,
  EmailVerificationRepository,
} from '@db/repositories';
import { OrgSubscriptionStatus, UserStatus } from '@db/enums';
import { AuthService } from '../../services/auth.service';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { UserRegisterCommand } from './user-register.command';
import { RegisterResponseDto } from '../../dtos/auth-response.dto';

@Injectable()
export class UserRegister {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly roleRepository: RoleRepository,
    private readonly emailVerificationRepository: EmailVerificationRepository,
    private readonly eventEmitter: AppEventEmitter,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: UserRegisterCommand): Promise<RegisterResponseDto> {
    const email = command.email.toLowerCase().trim();

    const verification =
      await this.emailVerificationRepository.findByEmail(email);
    if (!verification || !verification.verified) {
      throw new BadRequestException(
        'Email not verified. Please verify your email first.',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const waitlistMode =
      this.configService.get<string>('SIGNUP_WAITLIST_MODE') === 'true';

    if (waitlistMode) {
      this.eventEmitter.emit<SignupWaitlistJoinedEvent>({
        eventName: EventName.SIGNUP_WAITLIST_JOINED,
        timestamp: new Date(),
        email,
        firstName: command.firstName,
        lastName: command.lastName || null,
        phone: command.phone ?? null,
        phoneCountryCode: command.phoneCountryCode ?? null,
        organizationName: command.organizationName,
        userAgent: command.userAgent || null,
        ipAddress: command.ipAddress || null,
      });

      await this.emailVerificationRepository.delete({ email });

      return { waitlistMode: true };
    }

    const passwordHash = await this.authService.hashPassword(command.password);

    const orgName = command.organizationName;
    const slug = await this.generateUniqueSlug(orgName);
    const domain = `${slug}.rabbithr.app`;

    const organization = this.organizationRepository.create({
      name: orgName,
      slug,
      domain,
      plan: PlanId.FREE,
      subscriptionStatus: OrgSubscriptionStatus.ACTIVE,
    });
    await this.organizationRepository.save(organization);

    const adminRole = this.roleRepository.create({
      name: 'Admin',
      permissions: ALL_PERMISSIONS,
      organizationId: organization.id,
      isDefault: true,
    });
    const defaultRole = await this.roleRepository.save(adminRole);

    const user = this.userRepository.create({
      email,
      firstName: command.firstName,
      lastName: command.lastName || null,
      phone: command.phone ?? null,
      phoneCountryCode: command.phone ? command.phoneCountryCode || 'GB' : null,
      password: passwordHash,
      organizationId: organization.id,
      roleId: defaultRole.id,
      isActive: true,
      status: UserStatus.ACTIVE,
    });
    const savedUser = await this.userRepository.save(user);

    this.eventEmitter.emit<OrganizationCreatedEvent>({
      eventName: EventName.ORGANIZATION_CREATED,
      timestamp: new Date(),
      organizationId: organization.id,
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

    await this.emailVerificationRepository.delete({ email });

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName ?? '',
        lastName: savedUser.lastName ?? '',
        organizationId: savedUser.organizationId,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        isSystemOrg: organization.isSystemOrg,
      },
    };
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
