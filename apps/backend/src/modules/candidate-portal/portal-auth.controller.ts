import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  extractIpAddress,
  extractUserAgent,
} from '@shared/helpers/request-meta';
import {
  PortalAuthResponseDto,
  PortalBrandingDto,
  PortalOtpRequestedDto,
  PortalRefreshDto,
  PortalTokensDto,
  RequestPortalOtpDto,
  VerifyPortalOtpDto,
} from './dtos/portal.dto';
import { GetPortalBranding } from './usecases/get-portal-branding/get-portal-branding.usecase';
import { GetPortalBrandingCommand } from './usecases/get-portal-branding/get-portal-branding.command';
import { RequestPortalOtp } from './usecases/request-portal-otp/request-portal-otp.usecase';
import { RequestPortalOtpCommand } from './usecases/request-portal-otp/request-portal-otp.command';
import { VerifyPortalOtp } from './usecases/verify-portal-otp/verify-portal-otp.usecase';
import { VerifyPortalOtpCommand } from './usecases/verify-portal-otp/verify-portal-otp.command';
import { RefreshPortalSession } from './usecases/refresh-portal-session/refresh-portal-session.usecase';
import { RefreshPortalSessionCommand } from './usecases/refresh-portal-session/refresh-portal-session.command';
import { LogoutPortal } from './usecases/logout-portal/logout-portal.usecase';

const READ_LIMITS = {
  short: { limit: 5, ttl: 1000 },
  medium: { limit: 30, ttl: 10000 },
  long: { limit: 100, ttl: 60000 },
};

const OTP_LIMITS = {
  short: { limit: 2, ttl: 1000 },
  medium: { limit: 5, ttl: 10000 },
  long: { limit: 10, ttl: 60000 },
};

@ApiTags('Candidate Portal Auth')
@ApiCommonResponses()
@Controller('portal/auth')
export class PortalAuthController {
  constructor(
    private readonly getPortalBranding: GetPortalBranding,
    private readonly requestPortalOtp: RequestPortalOtp,
    private readonly verifyPortalOtp: VerifyPortalOtp,
    private readonly refreshPortalSession: RefreshPortalSession,
    private readonly logoutPortal: LogoutPortal,
  ) {}

  @Get(':orgSlug')
  @Throttle(READ_LIMITS)
  @ApiOperation({ summary: 'Public portal branding for an organization' })
  @ApiResponse(PortalBrandingDto)
  async branding(@Param('orgSlug') orgSlug: string) {
    return this.getPortalBranding.execute(
      GetPortalBrandingCommand.create({ orgSlug }),
    );
  }

  @Post(':orgSlug/otp/request')
  @HttpCode(HttpStatus.OK)
  @Throttle(OTP_LIMITS)
  @ApiOperation({ summary: 'Email a one time sign in code to a candidate' })
  @ApiResponse(PortalOtpRequestedDto)
  async requestOtp(
    @Param('orgSlug') orgSlug: string,
    @Body() dto: RequestPortalOtpDto,
  ) {
    return this.requestPortalOtp.execute(
      RequestPortalOtpCommand.create({ orgSlug, email: dto.email }),
    );
  }

  @Post(':orgSlug/otp/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle(OTP_LIMITS)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Verify a sign in code and start a portal session' })
  @ApiResponse(PortalAuthResponseDto)
  async verifyOtp(
    @Param('orgSlug') orgSlug: string,
    @Body() dto: VerifyPortalOtpDto,
    @Req() req: Request,
  ) {
    return this.verifyPortalOtp.execute(
      VerifyPortalOtpCommand.create({
        orgSlug,
        email: dto.email,
        code: dto.code,
        userAgent: extractUserAgent(req),
        ipAddress: extractIpAddress(req),
      }),
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle(READ_LIMITS)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Rotate a portal refresh token' })
  @ApiResponse(PortalTokensDto)
  async refresh(@Body() dto: PortalRefreshDto, @Req() req: Request) {
    return this.refreshPortalSession.execute(
      RefreshPortalSessionCommand.create({
        refreshToken: dto.refreshToken,
        userAgent: extractUserAgent(req),
        ipAddress: extractIpAddress(req),
      }),
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle(READ_LIMITS)
  @ApiOperation({ summary: 'End a portal session' })
  async logout(@Body() dto: PortalRefreshDto) {
    return this.logoutPortal.execute(
      RefreshPortalSessionCommand.create({ refreshToken: dto.refreshToken }),
    );
  }
}
