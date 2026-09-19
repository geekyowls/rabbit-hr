import { Injectable, UnauthorizedException } from '@nestjs/common';

import {
  RoleRepository,
  UserRepository,
  UserSessionRepository,
} from '@db/repositories';

import { AuthService } from '../../services/auth.service';
import { RefreshTokenCommand } from './refresh-token.command';
import { RefreshTokenResponseDto } from '../../dtos/refresh-token.dto';

@Injectable()
export class RefreshToken {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSessionRepository: UserSessionRepository,
    private readonly roleRepository: RoleRepository,
    private readonly authService: AuthService,
  ) {}

  async execute(
    command: RefreshTokenCommand,
  ): Promise<RefreshTokenResponseDto> {
    if (!command.jti) {
      throw new UnauthorizedException('Refresh token missing session id');
    }

    const session = await this.userSessionRepository.findActiveByJti(
      command.jti,
    );

    if (
      !session ||
      session.userId !== command.userId ||
      session.organizationId !== command.organizationId
    ) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (session.expiresAt < new Date()) {
      await this.userSessionRepository.revokeByJti(session.jti);
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: command.userId,
        organizationId: command.organizationId,
      },
    });

    if (!user || !user.isActive) {
      await this.userSessionRepository.revokeByJti(session.jti);
      throw new UnauthorizedException('User not found or inactive');
    }

    const role = user.roleId
      ? await this.roleRepository.findById(user.roleId)
      : null;

    const accessToken = this.authService.generateAccessToken(
      user,
      role?.permissions ?? [],
    );

    const { token: refreshToken, jti: newJti } =
      this.authService.generateRefreshToken(user);
    const refreshTokenExpires = this.authService.getRefreshTokenExpiry();

    session.jti = newJti;
    session.expiresAt = refreshTokenExpires;
    session.lastUsedAt = new Date();
    await this.userSessionRepository.save(session);

    return {
      accessToken,
      refreshToken,
    };
  }
}
