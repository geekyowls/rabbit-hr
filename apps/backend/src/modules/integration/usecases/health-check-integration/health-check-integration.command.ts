import { IsString, IsNotEmpty } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class HealthCheckIntegrationCommand extends OrganizationCommand {
  @IsString()
  @IsNotEmpty()
  readonly provider!: string;
}
