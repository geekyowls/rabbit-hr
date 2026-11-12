import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { FILE_EXTENSION_TO_MIME_TYPE, StorageService } from '@boilerplate/core';
import { portalUploadPrefix } from '../portal-documents';
import { GetPortalUploadUrlCommand } from './get-portal-upload-url.command';

@Injectable()
export class GetPortalUploadUrl {
  constructor(private readonly storageService: StorageService) {}

  async execute(command: GetPortalUploadUrlCommand) {
    const fileName = `${Date.now()}-${randomBytes(16).toString('hex')}.${command.extension}`;
    const key = `${portalUploadPrefix(command.organizationId, command.candidateId)}${fileName}`;
    const response = await this.storageService.getSignedUrl(
      key,
      FILE_EXTENSION_TO_MIME_TYPE[command.extension],
    );
    return { signedUrl: response.signedUrl, key };
  }
}
