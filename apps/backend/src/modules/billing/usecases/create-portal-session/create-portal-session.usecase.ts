import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingEntitlementsService } from '../../core/billing-entitlements.service';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '../../services/payment-provider.interface';
import { billingReturnUrl } from '../../billing.helpers';
import { BillingRedirectDto } from '../../dtos/billing.dto';
import { CreatePortalSessionCommand } from './create-portal-session.command';

@Injectable()
export class CreatePortalSession {
  constructor(
    private readonly entitlements: BillingEntitlementsService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly config: ConfigService,
  ) {}

  async execute(
    command: CreatePortalSessionCommand,
  ): Promise<BillingRedirectDto> {
    const state = await this.entitlements.getState(command.organizationId);
    if (!state.dodoCustomerId) {
      throw new BadRequestException(
        'No billing account yet. Choose a plan first',
      );
    }
    const url = await this.provider.createPortalLink(
      state.dodoCustomerId,
      billingReturnUrl(this.config),
    );
    return { url };
  }
}
