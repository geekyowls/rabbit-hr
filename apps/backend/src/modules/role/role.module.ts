import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { CreateRole } from './usecases/create-role/create-role.usecase';
import { UpdateRole } from './usecases/update-role/update-role.usecase';
import { ListRoles } from './usecases/list-roles/list-roles.usecase';
import { ListRolesDropdown } from './usecases/list-roles-dropdown/list-roles-dropdown.usecase';
import { GetRole } from './usecases/get-role/get-role.usecase';
import { DeleteRole } from './usecases/delete-role/delete-role.usecase';

const USE_CASES = [
  CreateRole,
  UpdateRole,
  ListRoles,
  ListRolesDropdown,
  GetRole,
  DeleteRole,
];

@Module({
  controllers: [RoleController],
  providers: [...USE_CASES],
})
export class RoleModule {}
