import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiOkPaginatedResponse } from '@shared/decorators/api-ok-paginated-response.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  CreateTaskDto,
  ListTasksDto,
  TaskResponseDto,
  UpdateTaskDto,
} from './dtos/task.dto';
import { ListTasks } from './usecases/list-tasks/list-tasks.usecase';
import { ListTasksCommand } from './usecases/list-tasks/list-tasks.command';
import { CreateTask } from './usecases/create-task/create-task.usecase';
import { CreateTaskCommand } from './usecases/create-task/create-task.command';
import { UpdateTask } from './usecases/update-task/update-task.usecase';
import { UpdateTaskCommand } from './usecases/update-task/update-task.command';
import { CompleteTask } from './usecases/complete-task/complete-task.usecase';
import { CompleteTaskCommand } from './usecases/complete-task/complete-task.command';
import { DeleteTask } from './usecases/delete-task/delete-task.usecase';
import { DeleteTaskCommand } from './usecases/delete-task/delete-task.command';

@ApiTags('Tasks')
@ApiCommonResponses()
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly listTasks: ListTasks,
    private readonly createTask: CreateTask,
    private readonly updateTask: UpdateTask,
    private readonly completeTask: CompleteTask,
    private readonly deleteTask: DeleteTask,
  ) {}

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.TASK_LIST_READ)
  @ApiOperation({ summary: 'List tasks with pagination and filters' })
  @ApiOkPaginatedResponse(TaskResponseDto)
  async list(@UserSession() user: UserSessionData, @Body() dto: ListTasksDto) {
    return this.listTasks.execute(
      ListTasksCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        page: dto.page,
        limit: dto.limit,
        status: dto.status,
        assigneeId: dto.assigneeId,
        mine: dto.mine,
        due: dto.due,
        candidateId: dto.candidateId,
        applicationId: dto.applicationId,
        jobId: dto.jobId,
        clientId: dto.clientId,
      }),
    );
  }

  @Post()
  @RequirePermissions(PERMISSIONS_ENUM.TASK_CREATE)
  @ApiOperation({ summary: 'Create a task' })
  @ApiResponse(TaskResponseDto, 201)
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateTaskDto,
  ) {
    return this.createTask.execute(
      CreateTaskCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        payload: dto,
      }),
    );
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS_ENUM.TASK_UPDATE)
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse(TaskResponseDto)
  async update(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.updateTask.execute(
      UpdateTaskCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        taskId: id,
        payload: dto,
      }),
    );
  }

  @Patch(':id/complete')
  @RequirePermissions(PERMISSIONS_ENUM.TASK_UPDATE)
  @ApiOperation({ summary: 'Mark a task as done' })
  @ApiResponse(TaskResponseDto)
  async complete(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.completeTask.execute(
      CompleteTaskCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        taskId: id,
      }),
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS_ENUM.TASK_DELETE)
  @ApiOperation({ summary: 'Delete a task' })
  async delete(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteTask.execute(
      DeleteTaskCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        taskId: id,
      }),
    );
  }
}
