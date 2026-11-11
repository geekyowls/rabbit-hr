import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { ListTasks } from './usecases/list-tasks/list-tasks.usecase';
import { CreateTask } from './usecases/create-task/create-task.usecase';
import { UpdateTask } from './usecases/update-task/update-task.usecase';
import { CompleteTask } from './usecases/complete-task/complete-task.usecase';
import { DeleteTask } from './usecases/delete-task/delete-task.usecase';

const USE_CASES = [ListTasks, CreateTask, UpdateTask, CompleteTask, DeleteTask];

@Module({
  controllers: [TaskController],
  providers: [...USE_CASES],
})
export class TaskModule {}
