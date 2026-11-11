import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  BookSlotDto,
  CancelPublicBookingDto,
  PublicBookingLinkDto,
  PublicSlotsQueryDto,
  PublicSlotsResponseDto,
} from './dtos/interview-booking.dto';
import { PublicBookingTokenCommand } from './usecases/public-booking-token.command';
import { GetPublicBooking } from './usecases/get-public-booking/get-public-booking.usecase';
import { ListPublicBookingSlots } from './usecases/list-public-booking-slots/list-public-booking-slots.usecase';
import { ListPublicBookingSlotsCommand } from './usecases/list-public-booking-slots/list-public-booking-slots.command';
import { BookPublicSlot } from './usecases/book-public-slot/book-public-slot.usecase';
import { BookPublicSlotCommand } from './usecases/book-public-slot/book-public-slot.command';
import { CancelPublicBooking } from './usecases/cancel-public-booking/cancel-public-booking.usecase';
import { CancelPublicBookingCommand } from './usecases/cancel-public-booking/cancel-public-booking.command';

const READ_LIMITS = {
  short: { limit: 5, ttl: 1000 },
  medium: { limit: 30, ttl: 10000 },
  long: { limit: 100, ttl: 60000 },
};

const WRITE_LIMITS = {
  short: { limit: 1, ttl: 1000 },
  medium: { limit: 3, ttl: 10000 },
  long: { limit: 10, ttl: 60000 },
};

@ApiTags('Public Interview Booking')
@ApiCommonResponses()
@Controller('public/interview-booking')
export class PublicBookingController {
  constructor(
    private readonly getPublicBooking: GetPublicBooking,
    private readonly listPublicBookingSlots: ListPublicBookingSlots,
    private readonly bookPublicSlot: BookPublicSlot,
    private readonly cancelPublicBooking: CancelPublicBooking,
  ) {}

  @Get(':token')
  @Throttle(READ_LIMITS)
  @ApiOperation({ summary: 'Booking link details for the candidate' })
  @ApiResponse(PublicBookingLinkDto)
  async details(@Param('token') token: string) {
    return this.getPublicBooking.execute(
      PublicBookingTokenCommand.create({ token }),
    );
  }

  @Get(':token/slots')
  @Throttle(READ_LIMITS)
  @ApiOperation({ summary: 'Available interview slots grouped by day' })
  @ApiResponse(PublicSlotsResponseDto)
  async slots(
    @Param('token') token: string,
    @Query() query: PublicSlotsQueryDto,
  ) {
    return this.listPublicBookingSlots.execute(
      ListPublicBookingSlotsCommand.create({
        token,
        from: query.from,
        to: query.to,
        timezone: query.timezone,
      }),
    );
  }

  @Post(':token/book')
  @HttpCode(HttpStatus.OK)
  @Throttle(WRITE_LIMITS)
  @ApiOperation({ summary: 'Book an interview slot' })
  @ApiResponse(PublicBookingLinkDto)
  async book(@Param('token') token: string, @Body() dto: BookSlotDto) {
    return this.bookPublicSlot.execute(
      BookPublicSlotCommand.create({
        token,
        startsAt: dto.startsAt,
        timezone: dto.timezone,
      }),
    );
  }

  @Post(':token/cancel')
  @HttpCode(HttpStatus.OK)
  @Throttle(WRITE_LIMITS)
  @ApiOperation({ summary: 'Cancel the booked interview or decline the link' })
  @ApiResponse(PublicBookingLinkDto)
  async cancel(
    @Param('token') token: string,
    @Body() dto: CancelPublicBookingDto,
  ) {
    return this.cancelPublicBooking.execute(
      CancelPublicBookingCommand.create({ token, reason: dto.reason }),
    );
  }
}
