import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import {
  UploadTypesEnum,
  UPLOAD_TYPE_ALLOWED_EXTENSIONS,
} from '@boilerplate/core';

@ValidatorConstraint({ name: 'IsValidExtensionForType', async: false })
class IsValidExtensionForTypeConstraint implements ValidatorConstraintInterface {
  validate(extension: string, args: ValidationArguments): boolean {
    const object = args.object as GetUploadUrlQueryDto;

    if (!object.type) {
      return false;
    }

    const allowedExtensions = UPLOAD_TYPE_ALLOWED_EXTENSIONS[object.type];
    return allowedExtensions.includes(extension.toLowerCase());
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as GetUploadUrlQueryDto;

    if (!object.type) {
      return 'Upload type is required to validate extension';
    }

    const allowedExtensions = UPLOAD_TYPE_ALLOWED_EXTENSIONS[object.type];
    return `Extension must be one of: ${allowedExtensions.join(', ')} for ${object.type}`;
  }
}

export class GetUploadUrlQueryDto {
  @ApiProperty({
    description:
      'File extension (must match allowed extensions for the upload type)',
    example: 'pdf',
  })
  @IsString()
  @Validate(IsValidExtensionForTypeConstraint)
  extension!: string;

  @ApiProperty({
    description: 'Upload type',
    enum: UploadTypesEnum,
    example: UploadTypesEnum.DOCUMENT,
  })
  @IsEnum(UploadTypesEnum)
  type!: UploadTypesEnum;
}
