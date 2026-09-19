import { Injectable } from '@nestjs/common';
import { EventName, UserLoggedOutEvent } from '@boilerplate/core';
import { UserSessionRepository } from '@db/repositories';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { AuthService } from '../../services/auth.service';
import { LogoutCommand } from './logout.command';
import { LogoutResponseDto } from '../../dtos/logout.dto';

@Injectable()
export class Logout {
  constructor(
    private readonly userSessionRepository: UserSessionRepository,
    private readonly authService: AuthService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  async execute(command: LogoutCommand): Promise<LogoutResponseDto> {
    if (command.refreshToken) {
      try {
        const payload = await this.authService.verifyRefreshToken(
          command.refreshToken,
        );
        const jti: string | undefined = payload?.jti;
        if (jti) {
          await this.userSessionRepository.revokeByJti(jti);
        }
      } catch {
        // Token already invalid or expired - nothing to revoke.
      }
    } else if (command.userId) {
      await this.userSessionRepository.revokeAllForUser(command.userId);
    }

    if (command.userId && command.organizationId) {
      this.eventEmitter.emit<UserLoggedOutEvent>({
        eventName: EventName.USER_LOGGED_OUT,
        timestamp: new Date(),
        userId: command.userId,
        organizationId: command.organizationId,
        triggeredBy: command.userId,
      });
    }

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
