import { Module } from '@nestjs/common';
import { CustomFieldController } from './custom-field.controller';
import { ListCustomFields } from './usecases/list-custom-fields/list-custom-fields.usecase';
import { CreateCustomField } from './usecases/create-custom-field/create-custom-field.usecase';
import { UpdateCustomField } from './usecases/update-custom-field/update-custom-field.usecase';
import { DeleteCustomField } from './usecases/delete-custom-field/delete-custom-field.usecase';
import { ReorderCustomFields } from './usecases/reorder-custom-fields/reorder-custom-fields.usecase';

const USE_CASES = [
  ListCustomFields,
  CreateCustomField,
  UpdateCustomField,
  DeleteCustomField,
  ReorderCustomFields,
];

@Module({
  controllers: [CustomFieldController],
  providers: [...USE_CASES],
})
export class CustomFieldModule {}
