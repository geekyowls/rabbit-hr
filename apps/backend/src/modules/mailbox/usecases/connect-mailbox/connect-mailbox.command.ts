import { IsArray, IsBoolean, IsEnum, IsString } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { MailboxProvider } from '@db/enums';

export class ConnectMailboxCommand extends OrganizationCommand {
  @IsEnum(MailboxProvider)
  readonly provider: MailboxProvider;

  @IsBoolean()
  readonly shared: boolean;

  @IsArray()
  @IsString({ each: true })
  readonly permissions: string[];
}
