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
import { ListClientsDto } from './dtos/list-clients.dto';
import { CreateClientDto } from './dtos/create-client.dto';
import { UpdateClientDto } from './dtos/update-client.dto';
import {
  CreateClientContactDto,
  UpdateClientContactDto,
} from './dtos/client-contact.dto';
import {
  ClientContactResponseDto,
  ClientDetailDto,
  ClientListItemDto,
} from './dtos/client-response.dto';
import { ListClients } from './usecases/list-clients/list-clients.usecase';
import { ListClientsCommand } from './usecases/list-clients/list-clients.command';
import { CreateClient } from './usecases/create-client/create-client.usecase';
import { CreateClientCommand } from './usecases/create-client/create-client.command';
import { GetClient } from './usecases/get-client/get-client.usecase';
import { UpdateClient } from './usecases/update-client/update-client.usecase';
import { UpdateClientCommand } from './usecases/update-client/update-client.command';
import { DeleteClient } from './usecases/delete-client/delete-client.usecase';
import { DeleteClientCommand } from './usecases/delete-client/delete-client.command';
import { CreateClientContact } from './usecases/create-client-contact/create-client-contact.usecase';
import { CreateClientContactCommand } from './usecases/create-client-contact/create-client-contact.command';
import { UpdateClientContact } from './usecases/update-client-contact/update-client-contact.usecase';
import { UpdateClientContactCommand } from './usecases/update-client-contact/update-client-contact.command';
import { DeleteClientContact } from './usecases/delete-client-contact/delete-client-contact.usecase';
import { DeleteClientContactCommand } from './usecases/delete-client-contact/delete-client-contact.command';

@ApiTags('Clients')
@ApiCommonResponses()
@Controller('clients')
export class ClientController {
  constructor(
    private readonly listClients: ListClients,
    private readonly createClient: CreateClient,
    private readonly getClient: GetClient,
    private readonly updateClient: UpdateClient,
    private readonly deleteClient: DeleteClient,
    private readonly createClientContact: CreateClientContact,
    private readonly updateClientContact: UpdateClientContact,
    private readonly deleteClientContact: DeleteClientContact,
  ) {}

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.CLIENT_LIST_READ)
  @ApiOperation({ summary: 'List clients with pagination and filters' })
  @ApiOkPaginatedResponse(ClientListItemDto)
  async list(
    @UserSession() user: UserSessionData,
    @Body() dto: ListClientsDto,
  ) {
    return this.listClients.execute(
      ListClientsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        page: dto.page,
        limit: dto.limit,
        search: dto.search,
        status: dto.status,
      }),
    );
  }

  @Post()
  @RequirePermissions(PERMISSIONS_ENUM.CLIENT_CREATE)
  @ApiOperation({ summary: 'Create a client' })
  @ApiResponse(ClientDetailDto, 201)
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateClientDto,
  ) {
    return this.createClient.execute(
      CreateClientCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        payload: dto,
      }),
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS_ENUM.CLIENT_READ)
  @ApiOperation({ summary: 'Get a client with contacts and counts' })
  @ApiResponse(ClientDetailDto)
  async get(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getClient.execute(id, user.organizationId);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS_ENUM.CLIENT_UPDATE)
  @ApiOperation({ summary: 'Update a client' })
  @ApiResponse(ClientDetailDto)
  async update(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.updateClient.execute(
      UpdateClientCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        clientId: id,
        payload: dto,
      }),
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS_ENUM.CLIENT_DELETE)
  @ApiOperation({ summary: 'Delete a client' })
  async delete(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteClient.execute(
      DeleteClientCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        clientId: id,
      }),
    );
  }

  @Post(':id/contacts')
  @RequirePermissions(PERMISSIONS_ENUM.CLIENT_UPDATE)
  @ApiOperation({ summary: 'Add a contact to a client' })
  @ApiResponse(ClientContactResponseDto, 201)
  async createContact(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateClientContactDto,
  ) {
    return this.createClientContact.execute(
      CreateClientContactCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        clientId: id,
        payload: dto,
      }),
    );
  }

  @Put(':id/contacts/:contactId')
  @RequirePermissions(PERMISSIONS_ENUM.CLIENT_UPDATE)
  @ApiOperation({ summary: 'Update a client contact' })
  @ApiResponse(ClientContactResponseDto)
  async updateContact(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Body() dto: UpdateClientContactDto,
  ) {
    return this.updateClientContact.execute(
      UpdateClientContactCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        clientId: id,
        contactId,
        payload: dto,
      }),
    );
  }

  @Delete(':id/contacts/:contactId')
  @RequirePermissions(PERMISSIONS_ENUM.CLIENT_UPDATE)
  @ApiOperation({ summary: 'Delete a client contact' })
  async deleteContact(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
  ) {
    return this.deleteClientContact.execute(
      DeleteClientContactCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        clientId: id,
        contactId,
      }),
    );
  }
}
