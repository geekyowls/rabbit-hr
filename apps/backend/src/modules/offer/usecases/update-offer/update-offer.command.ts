import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { UpdateOfferDto } from '../../dtos/offer.dto';

export class UpdateOfferCommand extends OrganizationCommand {
  @IsUUID()
  readonly offerId: string;

  @ValidateNested()
  @Type(() => UpdateOfferDto)
  readonly payload: UpdateOfferDto;
}
