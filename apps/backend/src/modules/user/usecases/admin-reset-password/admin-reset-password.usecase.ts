import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';

import { UserRepository, UserSessionRepository } from '@db/repositories';
import { EventName, UserPasswordAdminResetEvent } from '@boilerplate/core';
import { AuthService } from '@modules/auth/services/auth.service';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';

import { AdminResetPasswordCommand } from './admin-reset-password.command';

export interface AdminResetPasswordResult {
  userId: string;
  email: string;
  generatedPassword: string;
}

@Injectable()
export class AdminResetPassword {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSessionRepository: UserSessionRepository,
    private readonly authService: AuthService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  async execute(
    command: AdminResetPasswordCommand,
  ): Promise<AdminResetPasswordResult> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: command.targetUserId })
      .andWhere('user.organizationId = :organizationId', {
        organizationId: command.organizationId,
      })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found in this organization');
    }

    if (user.id === command.currentUserId) {
      throw new ForbiddenException(
        'Cannot reset your own password from here. Use the change password option instead.',
      );
    }

    const generatedPassword = this.generateRandomPassword();
    const hashedPassword =
      await this.authService.hashPassword(generatedPassword);

    user.password = hashedPassword;
    await this.userRepository.save(user);
    await this.userSessionRepository.revokeAllForUser(user.id);

    if (command.notifyUser) {
      this.eventEmitter.emit<UserPasswordAdminResetEvent>({
        eventName: EventName.USER_PASSWORD_ADMIN_RESET,
        timestamp: new Date(),
        userId: user.id,
        organizationId: command.organizationId,
        password: generatedPassword,
        resetBy: command.currentUserId,
        triggeredBy: command.currentUserId,
      });
    }

    return {
      userId: user.id,
      email: user.email,
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
