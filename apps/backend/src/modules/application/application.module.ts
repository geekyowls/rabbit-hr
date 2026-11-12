import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ListApplications } from './usecases/list-applications/list-applications.usecase';
import { GetApplicationBoard } from './usecases/get-application-board/get-application-board.usecase';
import { CreateApplication } from './usecases/create-application/create-application.usecase';
import { GetApplication } from './usecases/get-application/get-application.usecase';
import { UpdateApplicationStage } from './usecases/update-application-stage/update-application-stage.usecase';
import { UpdateApplication } from './usecases/update-application/update-application.usecase';
import { DeleteApplication } from './usecases/delete-application/delete-application.usecase';

const USE_CASES = [
  ListApplications,
  GetApplicationBoard,
  CreateApplication,
  GetApplication,
  UpdateApplicationStage,
  UpdateApplication,
  DeleteApplication,
];

@Module({
  controllers: [ApplicationController],
  providers: [...USE_CASES],
})
export class ApplicationModule {}
