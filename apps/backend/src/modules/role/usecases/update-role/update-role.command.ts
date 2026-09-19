import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class UpdateRoleCommand extends OrganizationCommand {
  @IsString()
  @IsNotEmpty()
  readonly roleId: string;

  @IsString()
  @IsOptional()
  readonly name?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly permissions?: string[];
}
