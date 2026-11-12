import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  extractIpAddress,
  extractUserAgent,
} from '@shared/helpers/request-meta';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

import { PERMISSIONS_ENUM } from '@boilerplate/core';
import { BlockImpersonationGuard } from '@shared/guards/block-impersonation.guard';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import { RequireAuthentication } from '@shared/decorators/require-authentication.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { UserSession } from '@shared/decorators/user-session.decorator';
import type { UserSessionData } from '@shared/decorators/user-session.decorator';

import { RefreshJwtGuard } from './guards/refresh-jwt.guard';
import { LoginBodyDto } from './dtos/login.dto';
import { RegisterBodyDto } from './dtos/register.dto';
import {
  PasswordResetBodyDto,
  PasswordResetRequestBodyDto,
} from './dtos/password-reset.dto';
import { UpdatePasswordBodyDto } from './dtos/update-password.dto';
import {
  RefreshTokenBodyDto,
  RefreshTokenResponseDto,
} from './dtos/refresh-token.dto';
import { LogoutBodyDto, LogoutResponseDto } from './dtos/logout.dto';
import {
  LoginResponseDto,
  RegisterResponseDto,
} from './dtos/auth-response.dto';
import {
  SendSignupOtpDto,
  VerifySignupOtpDto,
  SendSignupOtpResponseDto,
  VerifySignupOtpResponseDto,
} from './dtos/signup-otp.dto';
import { LoginCommand } from './usecases/login/login.command';
import { UserRegisterCommand } from './usecases/register/user-register.command';
import { UserRegister } from './usecases/register/user-register.usecase';
import { Login } from './usecases/login/login.usecase';
import { PasswordResetCommand } from './usecases/password-reset/password-reset.command';
import { PasswordReset } from './usecases/password-reset/password-reset.usecase';
import { PasswordResetRequestCommand } from './usecases/password-reset-request/password-reset-request.command';
import { PasswordResetRequest } from './usecases/password-reset-request/password-reset-request.usecase';
import { UpdatePasswordCommand } from './usecases/update-password/update-password.command';
import { UpdatePassword } from './usecases/update-password/update-password.usecase';
import { RefreshTokenCommand } from './usecases/refresh-token/refresh-token.command';
import { RefreshToken } from './usecases/refresh-token/refresh-token.usecase';
import { LogoutCommand } from './usecases/logout/logout.command';
import { Logout } from './usecases/logout/logout.usecase';
import { ImpersonateCommand } from './usecases/impersonate/impersonate.command';
import { Impersonate } from './usecases/impersonate/impersonate.usecase';
import { ImpersonateBodyDto } from './dtos/impersonate.dto';
import {
  GoogleLoginBodyDto,
  GoogleLoginResponseDto,
} from './dtos/google-login.dto';
import { GoogleLoginCommand } from './usecases/google-login/google-login.command';
import { GoogleLogin } from './usecases/google-login/google-login.usecase';
import { SendSignupOtpCommand } from './usecases/send-signup-otp/send-signup-otp.command';
import { SendSignupOtp } from './usecases/send-signup-otp/send-signup-otp.usecase';
import { VerifySignupOtpCommand } from './usecases/verify-signup-otp/verify-signup-otp.command';
import { VerifySignupOtp } from './usecases/verify-signup-otp/verify-signup-otp.usecase';
import { UpdateOnboardingContextBodyDto } from './dtos/onboarding-context.dto';
import { UpdateOnboardingContextCommand } from './usecases/update-onboarding-context/update-onboarding-context.command';
import { UpdateOnboardingContext } from './usecases/update-onboarding-context/update-onboarding-context.usecase';

@Controller('/auth')
@ApiTags('Auth')
@ApiCommonResponses()
export class AuthController {
  constructor(
    private readonly loginUsecase: Login,
    private readonly registerUsecase: UserRegister,
    private readonly passwordResetRequestUsecase: PasswordResetRequest,
    private readonly passwordResetUsecase: PasswordReset,
    private readonly updatePasswordUsecase: UpdatePassword,
    private readonly refreshTokenUsecase: RefreshToken,
    private readonly logoutUsecase: Logout,
    private readonly impersonateUsecase: Impersonate,
    private readonly googleLoginUsecase: GoogleLogin,
    private readonly sendSignupOtpUsecase: SendSignupOtp,
    private readonly verifySignupOtpUsecase: VerifySignupOtp,
    private readonly updateOnboardingContextUsecase: UpdateOnboardingContext,
  ) {}

  @Post('/signup/send-otp')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Send OTP for signup email verification' })
  @ApiResponse(SendSignupOtpResponseDto)
  async sendSignupOtp(
    @Body() body: SendSignupOtpDto,
  ): Promise<SendSignupOtpResponseDto> {
    return await this.sendSignupOtpUsecase.execute(
      SendSignupOtpCommand.create({
        email: body.email,
      }),
    );
  }

  @Post('/signup/verify-otp')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Verify OTP for signup email verification' })
  @ApiResponse(VerifySignupOtpResponseDto)
  async verifySignupOtp(
    @Body() body: VerifySignupOtpDto,
  ): Promise<VerifySignupOtpResponseDto> {
    return await this.verifySignupOtpUsecase.execute(
      VerifySignupOtpCommand.create({
        email: body.email,
        otp: body.otp,
      }),
    );
  }

  @Post('/register')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Register a new user and organization' })
  @ApiResponse(RegisterResponseDto)
  async register(
    @Body() body: RegisterBodyDto,
    @Req() req: Request,
  ): Promise<RegisterResponseDto> {
    return await this.registerUsecase.execute(
      UserRegisterCommand.create({
        email: body.email,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        phoneCountryCode: body.phoneCountryCode,
        organizationName: body.organizationName,
        userAgent: extractUserAgent(req),
        ipAddress: extractIpAddress(req),
      }),
    );
  }

  @Post('/login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse(LoginResponseDto)
  async login(
    @Body() body: LoginBodyDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    return await this.loginUsecase.execute(
      LoginCommand.create({
        email: body.email,
        password: body.password,
        userAgent: extractUserAgent(req),
        ipAddress: extractIpAddress(req),
      }),
    );
  }

  @Post('/google')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Login or signup with Google OAuth' })
  @ApiResponse(GoogleLoginResponseDto)
  async googleLogin(
    @Body() body: GoogleLoginBodyDto,
  ): Promise<GoogleLoginResponseDto> {
    return await this.googleLoginUsecase.execute(
      GoogleLoginCommand.create({
        accessToken: body.accessToken,
      }),
    );
  }

  @Post('/reset/request')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @ApiOperation({ summary: 'Request password reset token' })
  @ApiResponse(Object)
  async requestPasswordReset(
    @Body() body: PasswordResetRequestBodyDto,
  ): Promise<{ success: boolean }> {
    return await this.passwordResetRequestUsecase.execute(
      PasswordResetRequestCommand.create({
        email: body.email,
      }),
    );
  }

  @Post('/reset')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse(Object)
  async resetPassword(
    @Body() body: PasswordResetBodyDto,
  ): Promise<{ success: boolean }> {
    return await this.passwordResetUsecase.execute(
      PasswordResetCommand.create({
        password: body.password,
        token: body.token,
      }),
    );
  }

  @Post('/update-password')
  @RequireAuthentication()
  @UseGuards(BlockImpersonationGuard)
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Update password for authenticated user' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePassword(
    @UserSession() user: UserSessionData,
    @Body() body: UpdatePasswordBodyDto,
  ): Promise<void> {
    return await this.updatePasswordUsecase.execute(
      UpdatePasswordCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
        confirmPassword: body.confirmPassword,
      }),
    );
  }

  @Post('/refresh')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse(RefreshTokenResponseDto)
  @UseGuards(RefreshJwtGuard)
  @ApiBearerAuth()
  async refreshToken(
    @UserSession() user: UserSessionData,
    @Body() body: RefreshTokenBodyDto,
  ): Promise<RefreshTokenResponseDto> {
    return await this.refreshTokenUsecase.execute(
      RefreshTokenCommand.create({
        refreshToken: body.refreshToken,
        userId: user.userId,
        organizationId: user.organizationId,
        jti: user.jti,
      }),
    );
  }

  @Post('/logout')
  @RequireAuthentication()
  @SkipThrottle()
  @Header('Cache-Control', 'no-store')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user and invalidate refresh token' })
  @ApiResponse(LogoutResponseDto)
  async logout(
    @UserSession() user: UserSessionData,
    @Body() body: LogoutBodyDto,
  ): Promise<LogoutResponseDto> {
    return await this.logoutUsecase.execute(
      LogoutCommand.create({
        refreshToken: body.refreshToken,
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Post('/onboarding-context')
  @RequireAuthentication()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Set onboarding context (practice type and team size)',
  })
  @ApiResponse(Object)
  async updateOnboardingContext(
    @UserSession() user: UserSessionData,
    @Body() body: UpdateOnboardingContextBodyDto,
  ): Promise<{ success: boolean }> {
    return await this.updateOnboardingContextUsecase.execute(
      UpdateOnboardingContextCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        practiceType: body.practiceType,
        teamSize: body.teamSize,
        phone: body.phone,
        phoneCountryCode: body.phoneCountryCode,
      }),
    );
  }

  @Post('/impersonate')
  @RequirePermissions(PERMISSIONS_ENUM.USER_IMPERSONATE)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Impersonate another user (requires password verification)',
  })
  @ApiResponse(LoginResponseDto)
  async impersonate(
    @UserSession() user: UserSessionData,
    @Body() body: ImpersonateBodyDto,
  ): Promise<LoginResponseDto> {
    return await this.impersonateUsecase.execute(
      ImpersonateCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        targetUserId: body.targetUserId,
        password: body.password,
      }),
    );
  }
}
