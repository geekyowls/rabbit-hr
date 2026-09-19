import { UploadTypesEnum } from '@boilerplate/core';
import { IsDefined, IsEnum, IsString } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class GetSignedUrlCommand extends OrganizationCommand {
  @IsString()
  extension: string;

  @IsDefined()
  @IsEnum(UploadTypesEnum)
  type: UploadTypesEnum;
}
