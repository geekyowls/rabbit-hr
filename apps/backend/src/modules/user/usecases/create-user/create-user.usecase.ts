import { Injectable, ConflictException } from '@nestjs/common';
import { randomBytes } from 'crypto';

import { UserRepository, RoleRepository } from '@db/repositories';
import { UserStatus } from '@db/enums';
import {
  EventName,
  UserCreatedEvent,
  UserCredentialsSentEvent,
} from '@boilerplate/core';
import { AuthService } from '@modules/auth/services/auth.service';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { BillingEntitlementsService } from '@modules/billing/core/billing-entitlements.service';

import { CreateUserCommand } from './create-user.command';

export interface CreateUserResult {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  generatedPassword: string | null;
}

@Injectable()
export class CreateUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly authService: AuthService,
    private readonly eventEmitter: AppEventEmitter,
    private readonly entitlements: BillingEntitlementsService,
  ) {}

  async execute(command: CreateUserCommand): Promise<CreateUserResult> {
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

    await this.entitlements.assertMemberCapacity(command.organizationId);

    if (command.roleId) {
      const role = await this.roleRepository.findOne({
        where: { id: command.roleId, organizationId: command.organizationId },
      });
      if (!role) {
        throw new ConflictException('Role not found in this organization');
      }
    }

    const generatedPassword = command.password
      ? null
      : this.generateRandomPassword();
    const passwordToHash = command.password || generatedPassword!;
    const hashedPassword = await this.authService.hashPassword(passwordToHash);

    const user = this.userRepository.create({
      email: command.email.toLowerCase(),
      password: hashedPassword,
      firstName: command.firstName || null,
      lastName: command.lastName || null,
      organizationId: command.organizationId,
      invitedBy: command.createdBy,
      roleId: command.roleId || null,
      status: UserStatus.ACTIVE,
      isActive: true,
      onboarded: true,
      inviteToken: null,
      inviteExpires: null,
    });

    const savedUser = await this.userRepository.save(user);

    this.eventEmitter.emit<UserCreatedEvent>({
      eventName: EventName.USER_CREATED,
      timestamp: new Date(),
      userId: savedUser.id,
      organizationId: command.organizationId,
      createdBy: command.createdBy,
      generatedPassword: generatedPassword || undefined,
      triggeredBy: command.createdBy,
    });

    if (command.notifyUser) {
      this.eventEmitter.emit<UserCredentialsSentEvent>({
        eventName: EventName.USER_CREDENTIALS_SENT,
        timestamp: new Date(),
        userId: savedUser.id,
        organizationId: command.organizationId,
        password: passwordToHash,
        triggeredBy: command.createdBy,
      });
    }

    return {
      userId: savedUser.id,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      generatedPassword,
    };
  }

  private generateRandomPassword(): string {
    const length = 16;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const bytes = randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[bytes[i] % charset.length];
    }
    return password;
  }
}
