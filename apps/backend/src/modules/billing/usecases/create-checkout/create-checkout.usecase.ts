import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrgSubscriptionStatus, TRIAL_PERIOD_DAYS } from '@boilerplate/core';
import { OrganizationRepository, UserRepository } from '@db/repositories';
import { formatUserName } from '@shared/helpers/user-name.utils';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '../../services/payment-provider.interface';
import { billingReturnUrl } from '../../billing.helpers';
import { BillingRedirectDto } from '../../dtos/billing.dto';
import { CreateCheckoutCommand } from './create-checkout.command';

const LIVE_STATUSES = [
  OrgSubscriptionStatus.ACTIVE,
  OrgSubscriptionStatus.TRIAL,
  OrgSubscriptionStatus.PAST_DUE,
];

@Injectable()
export class CreateCheckout {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly config: ConfigService,
  ) {}

  async execute(command: CreateCheckoutCommand): Promise<BillingRedirectDto> {
    const selection = { plan: command.plan, interval: command.interval };
    if (!this.provider.isAvailable(selection)) {
      throw new BadRequestException(
        'This plan is not available for online checkout. Contact us to subscribe',
      );
    }
    const organization = await this.organizationRepository.findOneOrFail({
      where: { id: command.organizationId },
    });
    if (
      organization.dodoSubscriptionId &&
      LIVE_STATUSES.includes(organization.subscriptionStatus)
    ) {
      throw new BadRequestException(
        'You already have a subscription. Change your plan instead',
      );
    }
    const user = await this.userRepository.findOneOrFail({
      where: { id: command.userId, organizationId: command.organizationId },
      select: ['id', 'email', 'firstName', 'lastName'],
    });
    const url = await this.provider.createCheckout({
      selection,
      customerId: organization.dodoCustomerId,
      email: user.email,
      name: formatUserName(user) ?? organization.name,
      returnUrl: billingReturnUrl(this.config),
      trialPeriodDays: organization.dodoCustomerId ? null : TRIAL_PERIOD_DAYS,
      organizationId: organization.id,
      userId: user.id,
    });
    return { url };
  }
}
