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
import { PERMISSIONS_ENUM, PlanFeature } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import {
  RequireAnyPermission,
  RequirePermissions,
} from '@shared/decorators/require-permissions.decorator';
import { RequirePlanFeature } from '@shared/decorators/require-plan-feature.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import { ATS_READ_PERMISSIONS } from '@shared/constants';
import {
  CreateCustomFieldDto,
  CustomFieldResponseDto,
  DeleteCustomFieldResponseDto,
  ListCustomFieldsQueryDto,
  ReorderCustomFieldsDto,
  UpdateCustomFieldDto,
} from './dtos/custom-field.dto';
import { ListCustomFields } from './usecases/list-custom-fields/list-custom-fields.usecase';
import { ListCustomFieldsCommand } from './usecases/list-custom-fields/list-custom-fields.command';
import { CreateCustomField } from './usecases/create-custom-field/create-custom-field.usecase';
import { CreateCustomFieldCommand } from './usecases/create-custom-field/create-custom-field.command';
import { UpdateCustomField } from './usecases/update-custom-field/update-custom-field.usecase';
import { UpdateCustomFieldCommand } from './usecases/update-custom-field/update-custom-field.command';
import { DeleteCustomField } from './usecases/delete-custom-field/delete-custom-field.usecase';
import { DeleteCustomFieldCommand } from './usecases/delete-custom-field/delete-custom-field.command';
import { ReorderCustomFields } from './usecases/reorder-custom-fields/reorder-custom-fields.usecase';
import { ReorderCustomFieldsCommand } from './usecases/reorder-custom-fields/reorder-custom-fields.command';

@ApiTags('Custom Fields')
@ApiCommonResponses()
@Controller('custom-fields')
export class CustomFieldController {
  constructor(
    private readonly listCustomFields: ListCustomFields,
    private readonly createCustomField: CreateCustomField,
    private readonly updateCustomField: UpdateCustomField,
    private readonly deleteCustomField: DeleteCustomField,
    private readonly reorderCustomFields: ReorderCustomFields,
  ) {}

  @Get()
  @RequireAnyPermission(
    ...ATS_READ_PERMISSIONS,
    PERMISSIONS_ENUM.CUSTOM_FIELD_MANAGE,
  )
  @ApiOperation({ summary: 'List custom field definitions' })
  @ApiResponse(CustomFieldResponseDto, 200, true)
  async list(
    @UserSession() user: UserSessionData,
    @Query() query: ListCustomFieldsQueryDto,
  ) {
    return this.listCustomFields.execute(
      ListCustomFieldsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        entity: query.entity,
        activeOnly: query.activeOnly,
      }),
    );
  }

  @Post()
  @RequirePermissions(PERMISSIONS_ENUM.CUSTOM_FIELD_MANAGE)
  @RequirePlanFeature(PlanFeature.CUSTOM_FIELDS)
  @ApiOperation({ summary: 'Create a custom field definition' })
  @ApiResponse(CustomFieldResponseDto, 201)
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateCustomFieldDto,
  ) {
    return this.createCustomField.execute(
      CreateCustomFieldCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        payload: dto,
      }),
    );
  }

  @Put('reorder')
  @RequirePermissions(PERMISSIONS_ENUM.CUSTOM_FIELD_MANAGE)
  @RequirePlanFeature(PlanFeature.CUSTOM_FIELDS)
  @ApiOperation({ summary: 'Reorder custom fields of an entity' })
  @ApiResponse(CustomFieldResponseDto, 200, true)
  async reorder(
    @UserSession() user: UserSessionData,
    @Body() dto: ReorderCustomFieldsDto,
  ) {
    return this.reorderCustomFields.execute(
      ReorderCustomFieldsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        entity: dto.entity,
        ids: dto.ids,
      }),
    );
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS_ENUM.CUSTOM_FIELD_MANAGE)
  @RequirePlanFeature(PlanFeature.CUSTOM_FIELDS)
  @ApiOperation({ summary: 'Update a custom field definition' })
  @ApiResponse(CustomFieldResponseDto)
  async update(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomFieldDto,
  ) {
    return this.updateCustomField.execute(
      UpdateCustomFieldCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        customFieldId: id,
        payload: dto,
      }),
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS_ENUM.CUSTOM_FIELD_MANAGE)
  @RequirePlanFeature(PlanFeature.CUSTOM_FIELDS)
  @ApiOperation({
    summary: 'Delete a custom field, or deactivate it when values exist',
  })
  @ApiResponse(DeleteCustomFieldResponseDto)
  async delete(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteCustomField.execute(
      DeleteCustomFieldCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        customFieldId: id,
      }),
    );
  }
}
