import { Injectable, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserRepository, RoleRepository } from '@db/repositories';
import { UserStatus } from '@db/enums';
import { buildUrl, generateInviteToken, addHours } from '@boilerplate/core';
import { EventName, UserInvitedEvent } from '@boilerplate/core';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';

import { InviteUserCommand } from './invite-user.command';

export interface InviteUserResult {
  userId: string;
  inviteLink: string;
  emailSent: boolean;
}

@Injectable()
export class InviteUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly configService: ConfigService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  async execute(command: InviteUserCommand): Promise<InviteUserResult> {
    const existingUser = await this.userRepository.findOne({
      where: {
        email: command.email.toLowerCase(),
        organizationId: command.organizationId,
      },
    });
    if (existingUser) {
      throw new ConflictException(
        'User with this email already exists in this organization',
      );
    }

    if (command.roleId) {
      const role = await this.roleRepository.findOne({
        where: { id: command.roleId, organizationId: command.organizationId },
      });
      if (!role) {
        throw new ConflictException('Role not found in this organization');
      }
    }

    // Generate invite token (24 hour expiry)
    const inviteToken = generateInviteToken();
    const inviteExpires = addHours(24);

    // Create user with invited status (no password yet - user will set during onboarding)
    const user = this.userRepository.create({
      email: command.email.toLowerCase(),
      password: null,
      firstName: command.firstName || null,
      lastName: command.lastName || null,
      organizationId: command.organizationId,
      invitedBy: command.invitedBy,
      roleId: command.roleId || null,
      status: UserStatus.INVITED,
      isActive: false,
      onboarded: false,
      inviteToken,
      inviteExpires,
    });

    // Save user to database
    const savedUser = await this.userRepository.save(user);

    const frontendBaseUrl = this.configService.get<string>('FRONTEND_BASE_URL');
    const inviteLink = buildUrl(
      frontendBaseUrl,
      `/accept-invite?token=${inviteToken}`,
    );

    this.eventEmitter.emit<UserInvitedEvent>({
      eventName: EventName.USER_INVITED,
      timestamp: new Date(),
      userId: savedUser.id,
      organizationId: command.organizationId,
      invitedBy: command.invitedBy,
      inviteLink,
      triggeredBy: command.invitedBy,
    });

    return {
      userId: savedUser.id,
      inviteLink,
      emailSent: true,
    };
  }
}
