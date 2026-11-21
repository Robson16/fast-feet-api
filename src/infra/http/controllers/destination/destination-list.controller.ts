import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { DEFAULT_PER_PAGE } from "@/core/repositories/pagination-params";
import { DestinationListUseCase } from "@/domain/order/application/use-cases/destination-list.usecase";
import { Roles } from "@/infra/auth/roles-decorator";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import { DestinationPresenter } from "@/infra/http/presenters/destination-presenter";
import {
  DestinationListQuerySchema,
  destinationListQuerySchema,
} from "@/infra/http/schemas/destination-list.schema";

@Controller("/destinations")
@ApiTags("Destinations")
@ApiBearerAuth()
export class DestinationListController {
  constructor(private destinationList: DestinationListUseCase) {}

  @Get()
  @Roles("ADMIN")
  @ApiOperation({
    summary: "List destinations",
    description:
      "Returns a paginated list of destinations. Requires ADMIN role.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number for pagination (minimum 1).",
    example: 1,
  })
  @ApiOkResponse({
    description: "Paginated list of destinations returned successfully.",
    schema: {
      type: "object",
      properties: {
        destinations: {
          type: "array",
          items: { type: "object" },
        },
        page: { type: "number", example: 1 },
        perPage: { type: "number", example: DEFAULT_PER_PAGE },
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid query parameters.",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required.",
  })
  @ApiForbiddenResponse({
    description: "Requires ADMIN role.",
  })
  async handle(
    @Query(new ZodValidationPipe(destinationListQuerySchema))
    query: DestinationListQuerySchema,
  ) {
    const result = await this.destinationList.execute({ page: query.page });

    if (result.isLeft()) {
      throw new BadRequestException(result.value);
    }

    return {
      destinations: result.value.destinations.map(DestinationPresenter.toHTTP),
      page: query.page,
      perPage: DEFAULT_PER_PAGE,
    };
  }
}
