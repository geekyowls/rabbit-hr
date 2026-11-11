import { Module } from '@nestjs/common';
import { StorageModule } from '@modules/storage/storage.module';
import { CareersController } from './careers.controller';
import { GetCareersOrganization } from './usecases/get-careers-organization/get-careers-organization.usecase';
import { ListCareersJobs } from './usecases/list-careers-jobs/list-careers-jobs.usecase';
import { GetCareersJob } from './usecases/get-careers-job/get-careers-job.usecase';
import { ApplyToJob } from './usecases/apply-to-job/apply-to-job.usecase';
import { GetCareersUploadUrl } from './usecases/get-careers-upload-url/get-careers-upload-url.usecase';

const USE_CASES = [
  GetCareersOrganization,
  ListCareersJobs,
  GetCareersJob,
  ApplyToJob,
  GetCareersUploadUrl,
];

@Module({
  imports: [StorageModule],
  controllers: [CareersController],
  providers: [...USE_CASES],
})
export class CareersModule {}
