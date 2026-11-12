import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { CreateOfferDto } from '../../dtos/offer.dto';

export class CreateOfferCommand extends OrganizationCommand {
  @ValidateNested()
  @Type(() => CreateOfferDto)
  readonly payload: CreateOfferDto;
}
