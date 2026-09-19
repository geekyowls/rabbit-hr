import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ContextLogger } from '@shared/framework/context-logger';
import {
  EventName,
  UserLoggedInEvent,
  RedisCacheService,
} from '@boilerplate/core';
import { UserRepository, UserSessionRepository } from '@db/repositories';
import { AuthService } from '../../services/auth.service';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { CACHE_KEYS, CACHE_TTL } from '@shared/cache-keys';
import { LoginCommand } from './login.command';
import { LoginResponseDto } from '../../dtos/auth-response.dto';

const MAX_LOGIN_ATTEMPTS = 5;

@Injectable()
export class Login {
  private readonly logger = new ContextLogger(Login.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSessionRepository: UserSessionRepository,
    private readonly authService: AuthService,
    private readonly eventEmitter: AppEventEmitter,
    private readonly cacheService: RedisCacheService,
  ) {}

  private async checkAccountLockout(email: string): Promise<void> {
    const key = CACHE_KEYS.loginAttempts(email);
    const attemptsStr = await this.cacheService.getString(key);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const ttl = await this.cacheService.client.ttl(key);
      const minutesRemaining = Math.ceil(ttl / 60);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Account temporarily locked due to too many failed login attempts. Please try again in ${minutesRemaining} minute(s).`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async recordFailedAttempt(email: string): Promise<void> {
    const key = CACHE_KEYS.loginAttempts(email);
    const attemptsStr = await this.cacheService.getString(key);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    await this.cacheService.setString(
      key,
      (attempts + 1).toString(),
      CACHE_TTL.LOGIN_LOCKOUT,
    );
  }

  private async clearFailedAttempts(email: string): Promise<void> {
    const key = CACHE_KEYS.loginAttempts(email);
    await this.cacheService.deleteKey(key);
  }

  async execute(command: LoginCommand): Promise<LoginResponseDto> {
    const email = command.email.toLowerCase().trim();

    await this.checkAccountLockout(email);

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.organization', 'organization')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      await this.recordFailedAttempt(email);
      this.logger.warn(`Login failed: user not found [email=${email}]`);
      throw new UnauthorizedException('Incorrect email or password provided');
    }

    if (!user.isActive) {
      await this.recordFailedAttempt(email);
      this.logger.warn(`Login failed: inactive account [email=${email}]`);
      throw new UnauthorizedException('Account is inactive');
    }

    if (!user.password) {
      this.logger.warn(`Login failed: Google-only account [email=${email}]`);
      throw new UnauthorizedException(
        'This account uses Google sign-in. Please use the Google button to log in.',
      );
    }

    const isPasswordValid = await this.authService.comparePasswords(
      command.password,
      user.password,
    );
    if (!isPasswordValid) {
      await this.recordFailedAttempt(email);
      this.logger.warn(`Login failed: wrong password [email=${email}]`);
      throw new UnauthorizedException('Incorrect email or password provided');
    }

    await this.clearFailedAttempts(email);

    const accessToken = this.authService.generateAccessToken(
      user,
      user.role?.permissions ?? [],
    );
    const { token: refreshToken, jti } =
      this.authService.generateRefreshToken(user);
    const refreshTokenExpires = this.authService.getRefreshTokenExpiry();

    await this.userSessionRepository.createSession({
      userId: user.id,
      organizationId: user.organizationId,
      jti,
      expiresAt: refreshTokenExpires,
      userAgent: command.userAgent ?? null,
      ipAddress: command.ipAddress ?? null,
    });

    this.eventEmitter.emit<UserLoggedInEvent>({
      eventName: EventName.USER_LOGGED_IN,
      timestamp: new Date(),
      userId: user.id,
      organizationId: user.organizationId,
      triggeredBy: user.id,
    });

    return {
      accessToken,
      refreshToken,
      isSystemOrg: user.organization.isSystemOrg,
    };
  }
}
