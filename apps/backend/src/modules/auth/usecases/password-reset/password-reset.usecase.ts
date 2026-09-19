import { BadRequestException, Injectable } from '@nestjs/common';
import { EventName, UserPasswordResetEvent } from '@boilerplate/core';
import { UserRepository, UserSessionRepository } from '@db/repositories';
import { AuthService } from '../../services/auth.service';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { PasswordResetCommand } from './password-reset.command';

@Injectable()
export class PasswordReset {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSessionRepository: UserSessionRepository,
    private readonly authService: AuthService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  async execute(command: PasswordResetCommand): Promise<{ success: boolean }> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect(['user.passwordResetToken', 'user.passwordResetExpires'])
      .where('user.passwordResetToken = :token', { token: command.token })
      .getOne();

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (!user.passwordResetExpires || new Date() > user.passwordResetExpires) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await this.authService.hashPassword(command.password);

    user.password = passwordHash;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.userRepository.save(user);
    await this.userSessionRepository.revokeAllForUser(user.id);

    this.eventEmitter.emit<UserPasswordResetEvent>({
      eventName: EventName.USER_PASSWORD_RESET,
      timestamp: new Date(),
      userId: user.id,
      triggeredBy: user.id,
    });

    return { success: true };
  }
}
