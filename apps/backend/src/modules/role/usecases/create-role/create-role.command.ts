import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class CreateRoleCommand extends OrganizationCommand {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsArray()
  @IsString({ each: true })
  readonly permissions: string[];
}
