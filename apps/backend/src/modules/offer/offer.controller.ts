import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiOkPaginatedResponse } from '@shared/decorators/api-ok-paginated-response.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import { OfferDecision } from '@db/enums';
import {
  CreateOfferDto,
  ListOffersDto,
  OfferDecisionDto,
  OfferResponseDto,
  RespondOfferDto,
  UpdateOfferDto,
  WithdrawOfferDto,
} from './dtos/offer.dto';
import { ListOffers } from './usecases/list-offers/list-offers.usecase';
import { ListOffersCommand } from './usecases/list-offers/list-offers.command';
import { CreateOffer } from './usecases/create-offer/create-offer.usecase';
import { CreateOfferCommand } from './usecases/create-offer/create-offer.command';
import { GetOffer } from './usecases/get-offer/get-offer.usecase';
import { UpdateOffer } from './usecases/update-offer/update-offer.usecase';
import { UpdateOfferCommand } from './usecases/update-offer/update-offer.command';
import { SubmitOffer } from './usecases/submit-offer/submit-offer.usecase';
import { DecideOffer } from './usecases/decide-offer/decide-offer.usecase';
import { DecideOfferCommand } from './usecases/decide-offer/decide-offer.command';
import { SendOffer } from './usecases/send-offer/send-offer.usecase';
import { RespondOffer } from './usecases/respond-offer/respond-offer.usecase';
import { RespondOfferCommand } from './usecases/respond-offer/respond-offer.command';
import { WithdrawOffer } from './usecases/withdraw-offer/withdraw-offer.usecase';
import { DeleteOffer } from './usecases/delete-offer/delete-offer.usecase';
import { OfferActionCommand } from './usecases/offer-action.command';

@ApiTags('Offers')
@ApiCommonResponses()
@Controller('offers')
export class OfferController {
  constructor(
    private readonly listOffers: ListOffers,
    private readonly createOffer: CreateOffer,
    private readonly getOffer: GetOffer,
    private readonly updateOffer: UpdateOffer,
    private readonly submitOffer: SubmitOffer,
    private readonly decideOffer: DecideOffer,
    private readonly sendOffer: SendOffer,
    private readonly respondOffer: RespondOffer,
    private readonly withdrawOffer: WithdrawOffer,
    private readonly deleteOffer: DeleteOffer,
  ) {}

  private action(user: UserSessionData, offerId: string, reason?: string) {
    return OfferActionCommand.create({
      userId: user.userId,
      organizationId: user.organizationId,
      offerId,
      reason,
    });
  }

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.OFFER_LIST_READ)
  @ApiOperation({ summary: 'List offers with pagination and filters' })
  @ApiOkPaginatedResponse(OfferResponseDto)
  async list(@UserSession() user: UserSessionData, @Body() dto: ListOffersDto) {
    return this.listOffers.execute(
      ListOffersCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        page: dto.page,
        limit: dto.limit,
        status: dto.status,
        jobId: dto.jobId,
        clientId: dto.clientId,
        candidateId: dto.candidateId,
        applicationId: dto.applicationId,
        search: dto.search,
      }),
    );
  }

  @Post()
  @RequirePermissions(PERMISSIONS_ENUM.OFFER_CREATE)
  @ApiOperation({ summary: 'Draft an offer for an application' })
  @ApiResponse(OfferResponseDto, 201)
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateOfferDto,
  ) {
    return this.createOffer.execute(
      CreateOfferCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        payload: dto,
      }),
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS_ENUM.OFFER_READ)
  @ApiOperation({ summary: 'Get an offer' })
  @ApiResponse(OfferResponseDto)
  async get(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getOffer.execute(id, user.organizationId);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS_ENUM.OFFER_UPDATE)
  @ApiOperation({ summary: 'Edit a draft or rejected offer' })
  @ApiResponse(OfferResponseDto)
  async update(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfferDto,
  ) {
    return this.updateOffer.execute(
      UpdateOfferCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        offerId: id,
        payload: dto,
      }),
    );
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.OFFER_UPDATE)
  @ApiOperation({ summary: 'Submit a draft offer for approval' })
  @ApiResponse(OfferResponseDto)
  async submit(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.submitOffer.execute(this.action(user, id));
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.OFFER_APPROVE)
  @ApiOperation({ summary: 'Approve an offer as a listed approver' })
  @ApiResponse(OfferResponseDto)
  async approve(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OfferDecisionDto,
  ) {
    return this.decide(user, id, OfferDecision.APPROVED, dto.comment);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.OFFER_APPROVE)
  @ApiOperation({ summary: 'Reject an offer as a listed approver' })
  @ApiResponse(OfferResponseDto)
  async reject(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OfferDecisionDto,
  ) {
    return this.decide(user, id, OfferDecision.REJECTED, dto.comment);
  }

  private decide(
    user: UserSessionData,
    offerId: string,
    decision: OfferDecision,
    comment?: string,
  ) {
    return this.decideOffer.execute(
      DecideOfferCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        offerId,
        decision,
        reason: comment || undefined,
      }),
    );
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.OFFER_SEND)
  @ApiOperation({ summary: 'Send an approved offer to the candidate' })
  @ApiResponse(OfferResponseDto)
  async send(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sendOffer.execute(this.action(user, id));
  }

  @Post(':id/respond')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.OFFER_UPDATE)
  @ApiOperation({ summary: 'Record the candidate response to a sent offer' })
  @ApiResponse(OfferResponseDto)
  async respond(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondOfferDto,
  ) {
    return this.respondOffer.execute(
      RespondOfferCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        offerId: id,
        response: dto.response,
        reason: dto.reason || undefined,
      }),
    );
  }

  @Patch(':id/withdraw')
  @RequirePermissions(PERMISSIONS_ENUM.OFFER_UPDATE)
  @ApiOperation({ summary: 'Withdraw an offer' })
  @ApiResponse(OfferResponseDto)
  async withdraw(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WithdrawOfferDto,
  ) {
    return this.withdrawOffer.execute(
      this.action(user, id, dto.reason || undefined),
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS_ENUM.OFFER_DELETE)
  @ApiOperation({
    summary: 'Delete a draft, rejected, withdrawn or expired offer',
  })
  async delete(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteOffer.execute(this.action(user, id));
  }
}
