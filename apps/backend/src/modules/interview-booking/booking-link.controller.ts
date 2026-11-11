import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  BookingLinkResponseDto,
  CreateBookingLinkDto,
  CreateBookingLinkResponseDto,
  ListBookingLinksQueryDto,
} from './dtos/interview-booking.dto';
import { CreateBookingLink } from './usecases/create-booking-link/create-booking-link.usecase';
import { CreateBookingLinkCommand } from './usecases/create-booking-link/create-booking-link.command';
import { ListBookingLinks } from './usecases/list-booking-links/list-booking-links.usecase';
import { ListBookingLinksCommand } from './usecases/list-booking-links/list-booking-links.command';
import { CancelBookingLink } from './usecases/cancel-booking-link/cancel-booking-link.usecase';
import { CancelBookingLinkCommand } from './usecases/cancel-booking-link/cancel-booking-link.command';

@ApiTags('Interview Booking Links')
@ApiCommonResponses()
@Controller('interview-booking-links')
export class BookingLinkController {
  constructor(
    private readonly createBookingLink: CreateBookingLink,
    private readonly listBookingLinks: ListBookingLinks,
    private readonly cancelBookingLink: CancelBookingLink,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS_ENUM.INTERVIEW_CREATE)
  @ApiOperation({
    summary:
      'Create a self booking link for an application, optionally emailed to the candidate',
  })
  @ApiResponse(CreateBookingLinkResponseDto, 201)
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateBookingLinkDto,
  ) {
    return this.createBookingLink.execute(
      CreateBookingLinkCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        payload: dto,
      }),
    );
  }

  @Get()
  @RequirePermissions(PERMISSIONS_ENUM.INTERVIEW_LIST_READ)
  @ApiOperation({ summary: 'List booking links, newest first' })
  @ApiResponse(BookingLinkResponseDto, 200, true)
  async list(
    @UserSession() user: UserSessionData,
    @Query() query: ListBookingLinksQueryDto,
  ) {
    return this.listBookingLinks.execute(
      ListBookingLinksCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        applicationId: query.applicationId,
        status: query.status,
      }),
    );
  }

  @Patch(':id/cancel')
  @RequirePermissions(PERMISSIONS_ENUM.INTERVIEW_UPDATE)
  @ApiOperation({ summary: 'Cancel an open booking link' })
  @ApiResponse(BookingLinkResponseDto)
  async cancel(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cancelBookingLink.execute(
      CancelBookingLinkCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        bookingLinkId: id,
      }),
    );
  }
}
