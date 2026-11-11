import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class UpdateApplicationCommand extends OrganizationCommand {
  @IsUUID()
  readonly applicationId: string;

  @IsInt()
  @Min(0)
  @Max(5)
  @IsOptional()
  readonly rating?: number | null;

  @IsBoolean()
  @IsOptional()
  readonly shortlisted?: boolean;

  @IsUUID()
  @IsOptional()
  readonly ownerId?: string | null;
}
