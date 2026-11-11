import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  AcceptOfferSigningDto,
  DeclineOfferSigningDto,
} from './dtos/offer.dto';
import { GetOfferSigning } from './usecases/public-sign/get-offer-signing.usecase';
import { AcceptOfferSigning } from './usecases/public-sign/accept-offer-signing.usecase';
import { DeclineOfferSigning } from './usecases/public-sign/decline-offer-signing.usecase';
import {
  AcceptOfferSigningCommand,
  DeclineOfferSigningCommand,
  PublicOfferSignCommand,
} from './usecases/public-sign/public-sign.command';

const READ_LIMITS = {
  short: { limit: 5, ttl: 1000 },
  medium: { limit: 30, ttl: 10000 },
  long: { limit: 100, ttl: 60000 },
};

const WRITE_LIMITS = {
  short: { limit: 1, ttl: 1000 },
  medium: { limit: 5, ttl: 10000 },
  long: { limit: 10, ttl: 60000 },
};

@ApiTags('Public Offer Signing')
@ApiCommonResponses()
@Controller('public/offers/sign')
export class PublicOfferSignController {
  constructor(
    private readonly getOfferSigning: GetOfferSigning,
    private readonly acceptOfferSigning: AcceptOfferSigning,
    private readonly declineOfferSigning: DeclineOfferSigning,
  ) {}

  @Get(':token')
  @Throttle(READ_LIMITS)
  @ApiOperation({ summary: 'Offer letter and status for a signing link' })
  async get(@Param('token') token: string) {
    return this.getOfferSigning.execute(
      PublicOfferSignCommand.create({ token }),
    );
  }

  @Post(':token/accept')
  @HttpCode(HttpStatus.OK)
  @Throttle(WRITE_LIMITS)
  @ApiOperation({ summary: 'Accept and e-sign an offer' })
  async accept(
    @Param('token') token: string,
    @Body() dto: AcceptOfferSigningDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.acceptOfferSigning.execute(
      AcceptOfferSigningCommand.create({
        token,
        fullName: dto.fullName,
        consent: dto.consent,
        ip,
        userAgent,
      }),
    );
  }

  @Post(':token/decline')
  @HttpCode(HttpStatus.OK)
  @Throttle(WRITE_LIMITS)
  @ApiOperation({ summary: 'Decline an offer from the signing link' })
  async decline(
    @Param('token') token: string,
    @Body() dto: DeclineOfferSigningDto,
  ) {
    return this.declineOfferSigning.execute(
      DeclineOfferSigningCommand.create({ token, reason: dto.reason }),
    );
  }
}
