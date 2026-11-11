import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { CreateClientContactDto } from '../../dtos/client-contact.dto';

export class CreateClientContactCommand extends OrganizationCommand {
  @IsUUID()
  readonly clientId: string;

  @ValidateNested()
  @Type(() => CreateClientContactDto)
  readonly payload: CreateClientContactDto;
}
