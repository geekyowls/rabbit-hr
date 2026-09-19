import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserRepository, UserSessionRepository } from '@db/repositories';

import { UserSessionData } from '@shared/decorators/user-session.decorator';

interface RefreshJwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  jti?: string;
  isImpersonation?: boolean;
}

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly userSessionRepository: UserSessionRepository,
  ) {
    const refreshSecret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error(
        'JWT_REFRESH_SECRET is not defined in environment variables',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: refreshSecret,
    });
  }

  async validate(payload: RefreshJwtPayload): Promise<UserSessionData> {
    if (payload.isImpersonation) {
      throw new UnauthorizedException(
        'Impersonation sessions cannot be refreshed',
      );
    }

    if (!payload.jti) {
      throw new UnauthorizedException('Refresh token missing session id');
    }

    const session = await this.userSessionRepository.findActiveByJti(
      payload.jti,
    );
    if (
      !session ||
      session.userId !== payload.userId ||
      session.organizationId !== payload.organizationId
    ) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (session.expiresAt < new Date()) {
      await this.userSessionRepository.revokeByJti(session.jti);
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
      select: ['id', 'email', 'organizationId', 'isActive'],
    });

    if (!user || !user.isActive) {
      await this.userSessionRepository.revokeByJti(session.jti);
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      userId: payload.userId,
      email: payload.email,
      organizationId: payload.organizationId,
      permissions: [],
      jti: payload.jti,
    };
  }
}
