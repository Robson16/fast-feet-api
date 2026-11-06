import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { DestinationGetUseCase } from "@/domain/order/application/use-cases/destination-get.usecase";
import { Roles } from "@/infra/auth/roles-decorator";
import { DestinationPresenter } from "@/infra/http/presenters/destination-presenter";

@Controller("/destinations/:id")
@ApiTags("Destinations")
@ApiBearerAuth()
export class DestinationGetController {
  constructor(private destinationGet: DestinationGetUseCase) {}

  @Get()
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Get a destination by ID",
    description:
      "Returns details of a specific destination. Requires ADMIN role.",
  })
  @ApiParam({ name: "id", description: "Destination UUID", format: "uuid" })
  @ApiOkResponse({
    description: "Destination retrieved successfully.",
  })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiForbiddenResponse({ description: "Requires ADMIN role." })
  @ApiNotFoundResponse({ description: "Destination not found." })
  async handle(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
    const result = await this.destinationGet.execute({ destinationId: id });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return {
      destination: DestinationPresenter.toHTTP(result.value.destination),
    };
  }
}
