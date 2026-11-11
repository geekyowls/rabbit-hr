import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { CreateClientDto } from '../../dtos/create-client.dto';

export class CreateClientCommand extends OrganizationCommand {
  @ValidateNested()
  @Type(() => CreateClientDto)
  readonly payload: CreateClientDto;
}
