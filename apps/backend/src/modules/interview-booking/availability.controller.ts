import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequireAuthentication } from '@shared/decorators/require-authentication.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  AvailabilityResponseDto,
  CreateTimeOffDto,
  ListTimeOffQueryDto,
  TimeOffResponseDto,
  UpdateAvailabilityDto,
  UpdateTimeOffDto,
} from './dtos/interview-booking.dto';
import { GetMyAvailability } from './usecases/get-my-availability/get-my-availability.usecase';
import { GetMyAvailabilityCommand } from './usecases/get-my-availability/get-my-availability.command';
import { UpdateMyAvailability } from './usecases/update-my-availability/update-my-availability.usecase';
import { UpdateMyAvailabilityCommand } from './usecases/update-my-availability/update-my-availability.command';
import { ListMyTimeOff } from './usecases/list-my-time-off/list-my-time-off.usecase';
import { ListMyTimeOffCommand } from './usecases/list-my-time-off/list-my-time-off.command';
import { CreateMyTimeOff } from './usecases/create-my-time-off/create-my-time-off.usecase';
import { CreateMyTimeOffCommand } from './usecases/create-my-time-off/create-my-time-off.command';
import { UpdateMyTimeOff } from './usecases/update-my-time-off/update-my-time-off.usecase';
import { UpdateMyTimeOffCommand } from './usecases/update-my-time-off/update-my-time-off.command';
import { DeleteMyTimeOff } from './usecases/delete-my-time-off/delete-my-time-off.usecase';
import { DeleteMyTimeOffCommand } from './usecases/delete-my-time-off/delete-my-time-off.command';

@ApiTags('Interview Availability')
@ApiCommonResponses()
@Controller('me')
export class AvailabilityController {
  constructor(
    private readonly getMyAvailability: GetMyAvailability,
    private readonly updateMyAvailability: UpdateMyAvailability,
    private readonly listMyTimeOff: ListMyTimeOff,
    private readonly createMyTimeOff: CreateMyTimeOff,
    private readonly updateMyTimeOff: UpdateMyTimeOff,
    private readonly deleteMyTimeOff: DeleteMyTimeOff,
  ) {}

  @Get('availability')
  @RequireAuthentication()
  @ApiOperation({ summary: 'Get my interview availability' })
  @ApiResponse(AvailabilityResponseDto)
  async availability(@UserSession() user: UserSessionData) {
    return this.getMyAvailability.execute(
      GetMyAvailabilityCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Put('availability')
  @RequireAuthentication()
  @ApiOperation({ summary: 'Save my weekly interview hours' })
  @ApiResponse(AvailabilityResponseDto)
  async saveAvailability(
    @UserSession() user: UserSessionData,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.updateMyAvailability.execute(
      UpdateMyAvailabilityCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        payload: dto,
      }),
    );
  }

  @Get('time-off')
  @RequireAuthentication()
  @ApiOperation({ summary: 'List my upcoming time off' })
  @ApiResponse(TimeOffResponseDto, 200, true)
  async timeOff(
    @UserSession() user: UserSessionData,
    @Query() query: ListTimeOffQueryDto,
  ) {
    return this.listMyTimeOff.execute(
      ListMyTimeOffCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        from: query.from,
        to: query.to,
      }),
    );
  }

  @Post('time-off')
  @RequireAuthentication()
  @ApiOperation({ summary: 'Add time off' })
  @ApiResponse(TimeOffResponseDto, 201)
  async addTimeOff(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateTimeOffDto,
  ) {
    return this.createMyTimeOff.execute(
      CreateMyTimeOffCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        payload: dto,
      }),
    );
  }

  @Put('time-off/:id')
  @RequireAuthentication()
  @ApiOperation({ summary: 'Update time off' })
  @ApiResponse(TimeOffResponseDto)
  async editTimeOff(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTimeOffDto,
  ) {
    return this.updateMyTimeOff.execute(
      UpdateMyTimeOffCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        timeOffId: id,
        payload: dto,
      }),
    );
  }

  @Delete('time-off/:id')
  @RequireAuthentication()
  @ApiOperation({ summary: 'Delete time off' })
  async removeTimeOff(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteMyTimeOff.execute(
      DeleteMyTimeOffCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        timeOffId: id,
      }),
    );
  }
}
