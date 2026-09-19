import { ConfigService } from '@nestjs/config';
import {
  GCSStorageService,
  S3StorageService,
  StorageService,
} from './storage.service';

function getStorageServiceClass(service: string | undefined) {
  const normalizedService = service?.toUpperCase();

  // Also check process.env directly as fallback
  const envService = process.env.STORAGE_SERVICE?.toUpperCase();
  const finalService = normalizedService || envService;

  switch (finalService) {
    case 'GCS':
      return GCSStorageService;
    default:
      return S3StorageService;
  }
}

export const storageService = {
  provide: StorageService,
  useFactory: (configService: ConfigService) => {
    const storageType = configService.get<string>('STORAGE_SERVICE');
    const StorageClass = getStorageServiceClass(storageType);
    return new StorageClass();
  },
  inject: [ConfigService],
};

export { StorageService };
export { NonExistingFileError } from './non-existing-file.error';
