import type { Provider } from '@nestjs/common';
import { GetSignedUrl } from './get-signed-url/get-signed-url.usecase';
import { storageService } from '@boilerplate/core';

export const USE_CASES: Provider[] = [GetSignedUrl, storageService];
