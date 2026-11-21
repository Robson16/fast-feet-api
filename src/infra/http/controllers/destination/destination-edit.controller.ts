import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Put,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { DestinationEditUseCase } from "@/domain/order/application/use-cases/destination-edit.usecase";
import { Roles } from "@/infra/auth/roles-decorator";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import {
  destinationEditApiBody,
  DestinationEditBodySchema,
  destinationEditBodySchema,
} from "@/infra/http/schemas/destination-edit.schema";

@Controller("/destinations/:id")
@ApiTags("Destinations")
@ApiBearerAuth()
export class DestinationEditController {
  constructor(private destinationEdit: DestinationEditUseCase) {}

  @Put()
  @Roles("ADMIN")
  @HttpCode(204)
  @ApiOperation({
    summary: "Edit a destination",
    description: "Updates destination details. Requires ADMIN role.",
  })
  @ApiParam({ name: "id", description: "Destination UUID", format: "uuid" })
  @ApiBody(destinationEditApiBody)
  @ApiNoContentResponse({ description: "Destination updated successfully." })
  @ApiBadRequestResponse({ description: "Invalid data or UUID format." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiForbiddenResponse({ description: "Requires ADMIN role." })
  @ApiNotFoundResponse({ description: "Destination not found." })
  async handle(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body(new ZodValidationPipe(destinationEditBodySchema))
    body: DestinationEditBodySchema,
  ) {
    const {
      title,
      addressStreet,
      addressNumber,
      addressComplement,
      addressZipCode,
      addressNeighborhood,
      addressCity,
      addressState,
      addressCountry,
      latitude,
      longitude,
    } = body;

    const result = await this.destinationEdit.execute({
      destinationId: id,
      title,
      addressStreet,
      addressNumber,
      addressComplement,
      addressZipCode,
      addressNeighborhood,
      addressCity,
      addressState,
      addressCountry,
      latitude,
      longitude,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }
  }
}
