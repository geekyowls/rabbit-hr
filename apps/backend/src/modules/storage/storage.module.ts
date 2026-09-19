import { Module } from '@nestjs/common';
import { StorageService, storageService } from '@boilerplate/core';
import { StorageController } from './storage.controller';
import { USE_CASES } from './usecases';
import { GetSignedUrl } from './usecases/get-signed-url/get-signed-url.usecase';

@Module({
  providers: [...USE_CASES, storageService],
  controllers: [StorageController],
  exports: [GetSignedUrl, StorageService],
})
export class StorageModule {}
