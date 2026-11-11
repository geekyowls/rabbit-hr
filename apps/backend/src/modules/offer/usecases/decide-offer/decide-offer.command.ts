import { IsEnum } from 'class-validator';
import { OfferDecision } from '@db/enums';
import { OfferActionCommand } from '../offer-action.command';

export class DecideOfferCommand extends OfferActionCommand {
  @IsEnum(OfferDecision)
  readonly decision: OfferDecision;
}
