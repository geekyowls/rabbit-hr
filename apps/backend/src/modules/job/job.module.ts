import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { ListJobs } from './usecases/list-jobs/list-jobs.usecase';
import { CreateJob } from './usecases/create-job/create-job.usecase';
import { GetJob } from './usecases/get-job/get-job.usecase';
import { UpdateJob } from './usecases/update-job/update-job.usecase';
import { UpdateJobStatus } from './usecases/update-job-status/update-job-status.usecase';
import { DeleteJob } from './usecases/delete-job/delete-job.usecase';

const USE_CASES = [
  ListJobs,
  CreateJob,
  GetJob,
  UpdateJob,
  UpdateJobStatus,
  DeleteJob,
];

@Module({
  controllers: [JobController],
  providers: [...USE_CASES],
})
export class JobModule {}
