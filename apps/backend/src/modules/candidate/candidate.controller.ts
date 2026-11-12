import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { ListCandidatesDto } from './dtos/list-candidates.dto';
import { CreateCandidateDto } from './dtos/create-candidate.dto';
import { UpdateCandidateDto } from './dtos/update-candidate.dto';
import {
  CandidateDetailDto,
  CandidateListItemDto,
} from './dtos/candidate-response.dto';
import { ListCandidates } from './usecases/list-candidates/list-candidates.usecase';
import { ListCandidatesCommand } from './usecases/list-candidates/list-candidates.command';
import { CreateCandidate } from './usecases/create-candidate/create-candidate.usecase';
import { CreateCandidateCommand } from './usecases/create-candidate/create-candidate.command';
import { GetCandidate } from './usecases/get-candidate/get-candidate.usecase';
import { UpdateCandidate } from './usecases/update-candidate/update-candidate.usecase';
import { UpdateCandidateCommand } from './usecases/update-candidate/update-candidate.command';
import { DeleteCandidate } from './usecases/delete-candidate/delete-candidate.usecase';
import { DeleteCandidateCommand } from './usecases/delete-candidate/delete-candidate.command';

@ApiTags('Candidates')
@ApiCommonResponses()
@Controller('candidates')
export class CandidateController {
  constructor(
    private readonly listCandidates: ListCandidates,
    private readonly createCandidate: CreateCandidate,
    private readonly getCandidate: GetCandidate,
    private readonly updateCandidate: UpdateCandidate,
    private readonly deleteCandidate: DeleteCandidate,
  ) {}

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.CANDIDATE_LIST_READ)
  @ApiOperation({ summary: 'List candidates with pagination and filters' })
  @ApiOkPaginatedResponse(CandidateListItemDto)
  async list(
    @UserSession() user: UserSessionData,
    @Body() dto: ListCandidatesDto,
  ) {
    return this.listCandidates.execute(
      ListCandidatesCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        page: dto.page,
        limit: dto.limit,
        search: dto.search,
        tags: dto.tags,
        source: dto.source,
        jobId: dto.jobId,
        stage: dto.stage,
        stageCategory: dto.stageCategory,
        rightToWork: dto.rightToWork,
        ownerId: dto.ownerId,
      }),
    );
  }

  @Post()
  @RequirePermissions(PERMISSIONS_ENUM.CANDIDATE_CREATE)
  @ApiOperation({ summary: 'Create a candidate' })
  @ApiResponse(CandidateDetailDto, 201)
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateCandidateDto,
  ) {
    return this.createCandidate.execute(
      CreateCandidateCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        payload: dto,
      }),
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS_ENUM.CANDIDATE_READ)
  @ApiOperation({ summary: 'Get a candidate with applications' })
  @ApiResponse(CandidateDetailDto)
  async get(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getCandidate.execute(id, user.organizationId);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS_ENUM.CANDIDATE_UPDATE)
  @ApiOperation({ summary: 'Update a candidate' })
  @ApiResponse(CandidateDetailDto)
  async update(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCandidateDto,
  ) {
    return this.updateCandidate.execute(
      UpdateCandidateCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        candidateId: id,
        payload: dto,
      }),
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS_ENUM.CANDIDATE_DELETE)
  @ApiOperation({ summary: 'Delete a candidate' })
  async delete(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteCandidate.execute(
      DeleteCandidateCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        candidateId: id,
      }),
    );
  }
}
