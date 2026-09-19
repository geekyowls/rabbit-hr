import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserRepository } from '@db/repositories';

import { UserSessionData } from '@shared/decorators/user-session.decorator';

interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  permissions: string[];
  roleId?: string;
  impersonatedBy?: string;
  isImpersonation?: boolean;
}

interface CachedUserStatus {
  isActive: boolean;
  expiresAt: number;
}

const USER_CACHE_TTL_MS = 5000;

@Injectable()
export class AccessJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  private userStatusCache = new Map<string, CachedUserStatus>();

  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    const accessSecret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!accessSecret) {
      throw new Error(
        'JWT_ACCESS_SECRET is not defined in environment variables',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: accessSecret,
    });

    setInterval(() => this.cleanupExpiredCache(), USER_CACHE_TTL_MS * 2);
  }

  async validate(payload: JwtPayload): Promise<UserSessionData> {
    const now = Date.now();
    const cached = this.userStatusCache.get(payload.userId);

    if (cached && cached.expiresAt > now) {
      if (!cached.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }
    } else {
      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
        select: ['id', 'isActive'],
      });

      const isActive = user?.isActive ?? false;

      this.userStatusCache.set(payload.userId, {
        isActive,
        expiresAt: now + USER_CACHE_TTL_MS,
      });

      if (!isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }
    }

    return {
      userId: payload.userId,
      email: payload.email,
      organizationId: payload.organizationId,
      permissions: payload.permissions,
      roleId: payload.roleId,
      impersonatedBy: payload.impersonatedBy,
      isImpersonation: payload.isImpersonation,
    };
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [userId, cached] of this.userStatusCache.entries()) {
      if (cached.expiresAt < now) {
        this.userStatusCache.delete(userId);
      }
    }
  }
}
