import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ListClients } from './usecases/list-clients/list-clients.usecase';
import { CreateClient } from './usecases/create-client/create-client.usecase';
import { GetClient } from './usecases/get-client/get-client.usecase';
import { UpdateClient } from './usecases/update-client/update-client.usecase';
import { DeleteClient } from './usecases/delete-client/delete-client.usecase';
import { CreateClientContact } from './usecases/create-client-contact/create-client-contact.usecase';
import { UpdateClientContact } from './usecases/update-client-contact/update-client-contact.usecase';
import { DeleteClientContact } from './usecases/delete-client-contact/delete-client-contact.usecase';

const USE_CASES = [
  ListClients,
  CreateClient,
  GetClient,
  UpdateClient,
  DeleteClient,
  CreateClientContact,
  UpdateClientContact,
  DeleteClientContact,
];

@Module({
  controllers: [ClientController],
  providers: [...USE_CASES],
})
export class ClientModule {}
