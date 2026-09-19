import { IsString, IsNotEmpty } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class GetAuthUrlCommand extends OrganizationCommand {
  @IsString()
  @IsNotEmpty()
  readonly provider: string;
}
