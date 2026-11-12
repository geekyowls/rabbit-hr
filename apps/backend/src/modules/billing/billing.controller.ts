import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequireAuthentication } from '@shared/decorators/require-authentication.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ExcludeFromIdempotency } from '@shared/framework/exclude-from-idempotency';
import {
  BillingRedirectDto,
  BillingSummaryDto,
  SelectPlanDto,
  SyncSubscriptionDto,
} from './dtos/billing.dto';
import { GetBillingSummary } from './usecases/get-billing-summary/get-billing-summary.usecase';
import { GetBillingSummaryCommand } from './usecases/get-billing-summary/get-billing-summary.command';
import { CreateCheckout } from './usecases/create-checkout/create-checkout.usecase';
import { CreateCheckoutCommand } from './usecases/create-checkout/create-checkout.command';
import { ChangePlan } from './usecases/change-plan/change-plan.usecase';
import { ChangePlanCommand } from './usecases/change-plan/change-plan.command';
import { CreatePortalSession } from './usecases/create-portal-session/create-portal-session.usecase';
import { CreatePortalSessionCommand } from './usecases/create-portal-session/create-portal-session.command';
import { SetCancelAtPeriodEnd } from './usecases/set-cancel-at-period-end/set-cancel-at-period-end.usecase';
import { SetCancelAtPeriodEndCommand } from './usecases/set-cancel-at-period-end/set-cancel-at-period-end.command';
import { SyncSubscription } from './usecases/sync-subscription/sync-subscription.usecase';
import { SyncSubscriptionCommand } from './usecases/sync-subscription/sync-subscription.command';
import { HandlePaymentWebhook } from './usecases/handle-payment-webhook/handle-payment-webhook.usecase';
import { HandlePaymentWebhookCommand } from './usecases/handle-payment-webhook/handle-payment-webhook.command';

@ApiTags('Billing')
@ApiCommonResponses()
@Controller('billing')
export class BillingController {
  constructor(
    private readonly getBillingSummary: GetBillingSummary,
    private readonly createCheckout: CreateCheckout,
    private readonly changePlan: ChangePlan,
    private readonly createPortalSession: CreatePortalSession,
    private readonly setCancelAtPeriodEnd: SetCancelAtPeriodEnd,
    private readonly syncSubscription: SyncSubscription,
    private readonly handlePaymentWebhook: HandlePaymentWebhook,
  ) {}

  @Get()
  @RequireAuthentication()
  @ApiOperation({ summary: 'Current plan, status, limits and features' })
  @ApiResponse(BillingSummaryDto)
  async summary(@UserSession() user: UserSessionData) {
    return this.getBillingSummary.execute(
      GetBillingSummaryCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Post('checkout')
  @RequirePermissions(PERMISSIONS_ENUM.BILLING_MANAGE)
  @ApiOperation({ summary: 'Start a Dodo checkout for a plan' })
  @ApiResponse(BillingRedirectDto, 201)
  async checkout(
    @UserSession() user: UserSessionData,
    @Body() dto: SelectPlanDto,
  ) {
    return this.createCheckout.execute(
      CreateCheckoutCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        plan: dto.plan,
        interval: dto.interval,
      }),
    );
  }

  @Post('change-plan')
  @RequirePermissions(PERMISSIONS_ENUM.BILLING_MANAGE)
  @ApiOperation({ summary: 'Switch the current subscription to another plan' })
  @ApiResponse(BillingSummaryDto, 201)
  async changePlanHandler(
    @UserSession() user: UserSessionData,
    @Body() dto: SelectPlanDto,
  ) {
    return this.changePlan.execute(
      ChangePlanCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        plan: dto.plan,
        interval: dto.interval,
      }),
    );
  }

  @Post('portal')
  @RequirePermissions(PERMISSIONS_ENUM.BILLING_MANAGE)
  @ApiOperation({
    summary: 'Customer portal link for payment method and invoices',
  })
  @ApiResponse(BillingRedirectDto, 201)
  async portal(@UserSession() user: UserSessionData) {
    return this.createPortalSession.execute(
      CreatePortalSessionCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Post('cancel')
  @RequirePermissions(PERMISSIONS_ENUM.BILLING_MANAGE)
  @ApiOperation({ summary: 'Cancel the subscription at the end of the period' })
  @ApiResponse(BillingSummaryDto, 201)
  async cancel(@UserSession() user: UserSessionData) {
    return this.setCancelAtPeriodEnd.execute(
      SetCancelAtPeriodEndCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        cancelAtPeriodEnd: true,
      }),
    );
  }

  @Post('resume')
  @RequirePermissions(PERMISSIONS_ENUM.BILLING_MANAGE)
  @ApiOperation({ summary: 'Keep the subscription after a scheduled cancel' })
  @ApiResponse(BillingSummaryDto, 201)
  async resume(@UserSession() user: UserSessionData) {
    return this.setCancelAtPeriodEnd.execute(
      SetCancelAtPeriodEndCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        cancelAtPeriodEnd: false,
      }),
    );
  }

  @Post('sync')
  @RequirePermissions(PERMISSIONS_ENUM.BILLING_MANAGE)
  @ApiOperation({ summary: 'Pull the latest subscription state from Dodo' })
  @ApiResponse(BillingSummaryDto, 201)
  async sync(
    @UserSession() user: UserSessionData,
    @Body() dto: SyncSubscriptionDto,
  ) {
    return this.syncSubscription.execute(
      SyncSubscriptionCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        subscriptionId: dto.subscriptionId,
      }),
    );
  }

  @Post('webhooks/dodo')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ExcludeFromIdempotency()
  @ApiOperation({ summary: 'Dodo Payments webhook receiver (signed)' })
  async dodoWebhook(@Req() req: Request & { rawBody?: Buffer }) {
    return this.handlePaymentWebhook.execute(
      HandlePaymentWebhookCommand.create({
        rawBody: req.rawBody?.toString('utf8') ?? '',
        headers: {
          'webhook-id': req.header('webhook-id'),
          'webhook-signature': req.header('webhook-signature'),
          'webhook-timestamp': req.header('webhook-timestamp'),
        },
      }),
    );
  }
}
