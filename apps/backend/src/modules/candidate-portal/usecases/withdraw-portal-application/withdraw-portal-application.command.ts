import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PortalApplicationCommand } from '../get-portal-application/portal-application.command';

export class WithdrawPortalApplicationCommand extends PortalApplicationCommand {
  @IsString()
  @MaxLength(500)
  @IsOptional()
  readonly reason?: string | null;
}
