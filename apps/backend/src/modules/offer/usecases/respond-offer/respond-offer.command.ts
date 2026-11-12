import { IsEnum } from 'class-validator';
import { OfferResponse } from '@db/enums';
import { OfferActionCommand } from '../offer-action.command';

export class RespondOfferCommand extends OfferActionCommand {
  @IsEnum(OfferResponse)
  readonly response: OfferResponse;
}
