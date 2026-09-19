import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventName, UserPasswordResetRequestedEvent } from '@boilerplate/core';
import { UserRepository } from '@db/repositories';
import { AuthService } from '../../services/auth.service';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { PasswordResetRequestCommand } from './password-reset-request.command';

@Injectable()
export class PasswordResetRequest {
  private readonly logger = new Logger(PasswordResetRequest.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  async execute(
    command: PasswordResetRequestCommand,
  ): Promise<{ success: boolean }> {
    const email = command.email.toLowerCase().trim();
    this.logger.debug('Processing password reset request');

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user) {
      this.logger.log(`Password reset requested for user ${user.id}`);

      const token = this.authService.generatePasswordResetToken();
      const expiry = this.authService.getPasswordResetExpiry();

      user.passwordResetToken = token;
      user.passwordResetExpires = expiry;
      await this.userRepository.save(user);

      const frontendUrl =
        this.configService.get<string>('FRONTEND_BASE_URL') ||
        'http://localhost:3000';
      const resetLink = `${frontendUrl}/reset-password?token=${token}`;

      const event: UserPasswordResetRequestedEvent = {
        eventName: EventName.USER_PASSWORD_RESET_REQUESTED,
        timestamp: new Date(),
        userId: user.id,
        resetLink,
      };

      this.logger.log(`Password reset event emitted for user ${user.id}`);
      this.eventEmitter.emit<UserPasswordResetRequestedEvent>(event);

      return { success: true };
    }

    this.logger.debug('Password reset requested for non-existent user');
    return { success: true };
  }
}
