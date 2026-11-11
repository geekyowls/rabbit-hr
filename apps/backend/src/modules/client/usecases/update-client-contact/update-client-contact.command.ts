import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { UpdateClientContactDto } from '../../dtos/client-contact.dto';

export class UpdateClientContactCommand extends OrganizationCommand {
  @IsUUID()
  readonly clientId: string;

  @IsUUID()
  readonly contactId: string;

  @ValidateNested()
  @Type(() => UpdateClientContactDto)
  readonly payload: UpdateClientContactDto;
}
