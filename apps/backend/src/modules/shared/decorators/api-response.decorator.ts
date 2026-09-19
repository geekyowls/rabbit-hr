import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { DataWrapperDto } from '../dtos/data-wrapper-dto';

export const ApiResponse = <DataDto extends Type<unknown>>(
  dataDto: DataDto,
  statusCode: number = 200,
  isArray = false,
) => {
  const responseDecorator =
    statusCode === 201 ? ApiCreatedResponse : ApiOkResponse;

  const schema = isArray
    ? {
        properties: {
          data: { type: 'array', items: { $ref: getSchemaPath(dataDto) } },
        },
      }
    : { properties: { data: { $ref: getSchemaPath(dataDto) } } };

  return applyDecorators(
    ApiExtraModels(DataWrapperDto, dataDto),
    responseDecorator({ schema }),
  );
};
