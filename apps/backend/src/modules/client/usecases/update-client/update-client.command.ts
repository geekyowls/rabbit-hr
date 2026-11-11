import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { UpdateClientDto } from '../../dtos/update-client.dto';

export class UpdateClientCommand extends OrganizationCommand {
  @IsUUID()
  readonly clientId: string;

  @ValidateNested()
  @Type(() => UpdateClientDto)
  readonly payload: UpdateClientDto;
}
