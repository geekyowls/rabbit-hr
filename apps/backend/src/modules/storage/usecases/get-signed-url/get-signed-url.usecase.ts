import { Injectable } from '@nestjs/common';
import {
  StorageService,
  FILE_EXTENSION_TO_MIME_TYPE,
  UploadTypesEnum,
} from '@boilerplate/core';
import { randomBytes } from 'crypto';
import { UploadUrlResponse } from '../../dtos/upload-url-response.dto';
import { GetSignedUrlCommand } from './get-signed-url.command';

@Injectable()
export class GetSignedUrl {
  constructor(private storageService: StorageService) {}

  private mapTypeToPath(command: GetSignedUrlCommand): string {
    const randomId = randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const fileName = `${timestamp}-${randomId}.${command.extension}`;

    switch (command.type) {
      case UploadTypesEnum.DOCUMENT:
        return `organizations/${command.organizationId}/documents/${fileName}`;
      case UploadTypesEnum.IMAGE:
        return `organizations/${command.organizationId}/images/${fileName}`;
      case UploadTypesEnum.FILE:
      default:
        return `organizations/${command.organizationId}/files/${fileName}`;
    }
  }

  async execute(command: GetSignedUrlCommand): Promise<UploadUrlResponse> {
    const key = this.mapTypeToPath(command);
    const response = await this.storageService.getSignedUrl(
      key,
      FILE_EXTENSION_TO_MIME_TYPE[command.extension],
    );

    return {
      ...response,
      key,
    };
  }
}
