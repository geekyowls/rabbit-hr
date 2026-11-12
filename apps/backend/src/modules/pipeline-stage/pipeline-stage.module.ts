import { Module } from '@nestjs/common';
import { PipelineStageController } from './pipeline-stage.controller';
import { ListPipelineStages } from './usecases/list-pipeline-stages/list-pipeline-stages.usecase';
import { ReplacePipelineStages } from './usecases/replace-pipeline-stages/replace-pipeline-stages.usecase';

@Module({
  controllers: [PipelineStageController],
  providers: [ListPipelineStages, ReplacePipelineStages],
})
export class PipelineStageModule {}
