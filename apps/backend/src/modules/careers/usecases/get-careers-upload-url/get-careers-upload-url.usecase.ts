import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { FILE_EXTENSION_TO_MIME_TYPE, StorageService } from '@boilerplate/core';
import { OrganizationRepository } from '@db/repositories';
import { findCareersOrganization } from '../careers-query';
import { GetCareersUploadUrlCommand } from './get-careers-upload-url.command';

@Injectable()
export class GetCareersUploadUrl {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(command: GetCareersUploadUrlCommand) {
    const organization = await findCareersOrganization(
      this.organizationRepository,
      command.orgSlug,
    );
    const fileName = `${Date.now()}-${randomBytes(16).toString('hex')}.${command.extension}`;
    const key = `organizations/${organization.id}/careers/cv/${fileName}`;
    const response = await this.storageService.getSignedUrl(
      key,
      FILE_EXTENSION_TO_MIME_TYPE[command.extension],
    );
    return { signedUrl: response.signedUrl, path: response.path, key };
  }
}
