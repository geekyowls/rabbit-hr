import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class OfferActionCommand extends OrganizationCommand {
  @IsUUID()
  readonly offerId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @IsOptional()
  readonly reason?: string;
}
