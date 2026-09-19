import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UserEntity } from '@db/entities';
import {
  generatePasswordResetToken,
  addMinutes,
  addDays,
} from '@boilerplate/core';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateAccessToken(
    user: UserEntity,
    permissions: string[] = [],
    impersonatedBy?: string,
  ): string {
    const payload: Record<string, unknown> = {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      permissions,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      roleId: user.roleId ?? null,
    };

    if (impersonatedBy) {
      payload.impersonatedBy = impersonatedBy;
    }

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const expiresIn = this.configService.get('JWT_ACCESS_EXPIRES_IN') ?? '1h';

    return this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn,
    });
  }

  generateImpersonationToken(
    user: UserEntity,
    permissions: string[] = [],
    impersonatedBy: string,
  ): string {
    const payload: Record<string, unknown> = {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      permissions,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      roleId: user.roleId ?? null,
      impersonatedBy,
      isImpersonation: true,
    };

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');

    return this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: '30m',
    });
  }

  generateImpersonationRefreshToken(user: UserEntity): string {
    const payload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      isImpersonation: true,
    };

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    return this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '30m',
    });
  }

  getImpersonationRefreshTokenExpiry(): Date {
    return new Date(Date.now() + 30 * 60 * 1000);
  }

  generateRefreshToken(user: UserEntity): { token: string; jti: string } {
    const jti = crypto.randomUUID();
    const payload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      jti,
    };

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const expiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN') ?? '30d';

    const token = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn,
    });

    return { token, jti };
  }

  async verifyRefreshToken(token: string): Promise<any> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    return this.jwtService.verify(token, { secret: refreshSecret });
  }

  getRefreshTokenExpiry(): Date {
    return addDays(30);
  }

  generateJwtToken(user: UserEntity): string {
    return this.generateAccessToken(user);
  }

  generatePasswordResetToken(): string {
    return generatePasswordResetToken();
  }

  getPasswordResetExpiry(): Date {
    return addMinutes(30);
  }
}
