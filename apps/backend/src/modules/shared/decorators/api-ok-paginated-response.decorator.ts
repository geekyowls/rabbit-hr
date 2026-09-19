import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse as SwaggerApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { PaginatedResponseDto } from '../dtos/pagination-response';

export const ApiOkPaginatedResponse = <DataDto extends Type<unknown>>(
  dataDto: DataDto,
) =>
  applyDecorators(
    ApiExtraModels(PaginatedResponseDto, dataDto),
    SwaggerApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(dataDto) },
              },
            },
          },
        ],
      },
    }),
  );
