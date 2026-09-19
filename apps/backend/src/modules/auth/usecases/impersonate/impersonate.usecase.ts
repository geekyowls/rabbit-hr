import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventName, UserImpersonatedEvent } from '@boilerplate/core';
import { UserRepository } from '@db/repositories';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { AuthService } from '../../services/auth.service';
import { ImpersonateCommand } from './impersonate.command';
import { LoginResponseDto } from '../../dtos/auth-response.dto';

@Injectable()
export class Impersonate {
  private readonly logger = new Logger(Impersonate.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  async execute(command: ImpersonateCommand): Promise<LoginResponseDto> {
    if (command.userId === command.targetUserId) {
      throw new BadRequestException('Cannot impersonate yourself');
    }

    const actingUser = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: command.userId })
      .andWhere('user.organizationId = :organizationId', {
        organizationId: command.organizationId,
      })
      .getOne();

    if (!actingUser) {
      throw new UnauthorizedException('Invalid session');
    }

    const isPasswordValid = await this.authService.comparePasswords(
      command.password,
      actingUser.password ?? '',
    );

    if (!isPasswordValid) {
      this.logger.warn(
        `Failed impersonation attempt by user ${command.userId} - invalid password`,
      );
      throw new ForbiddenException(
        'Password verification failed. Please enter your current password to impersonate.',
      );
    }

    const targetUser = await this.userRepository.findOne({
      where: {
        id: command.targetUserId,
        organizationId: command.organizationId,
      },
      relations: { organization: true, role: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    if (!targetUser.isActive) {
      throw new ForbiddenException('Cannot impersonate an inactive user');
    }

    const accessToken = this.authService.generateImpersonationToken(
      targetUser,
      targetUser.role?.permissions ?? [],
      command.userId,
    );
    // Generate impersonation refresh token but DON'T store it in the target user's record
    // This prevents invalidating the target user's real session
    const refreshToken =
      this.authService.generateImpersonationRefreshToken(targetUser);

    this.logger.warn(
      `User ${command.userId} impersonated user ${command.targetUserId} (30-minute session)`,
    );

    const event: UserImpersonatedEvent = {
      eventName: EventName.USER_IMPERSONATED,
      timestamp: new Date(),
      actorId: command.userId,
      targetUserId: command.targetUserId,
      organizationId: command.organizationId,
    };
    this.eventEmitter.emit<UserImpersonatedEvent>(event);

    return {
      accessToken,
      refreshToken,
      isSystemOrg: targetUser.organization.isSystemOrg,
    };
  }
}
