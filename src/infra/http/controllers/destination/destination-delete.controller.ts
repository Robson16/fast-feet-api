import {
  Controller,
  Delete,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { DestinationDeleteUseCase } from "@/domain/order/application/use-cases/destination-delete.usecase";
import { Roles } from "@/infra/auth/roles-decorator";

@Controller("/destinations/:id")
@ApiTags("Destinations")
@ApiBearerAuth()
export class DestinationDeleteController {
  constructor(private destinationDelete: DestinationDeleteUseCase) {}

  @Delete()
  @Roles("ADMIN")
  @HttpCode(204)
  @ApiOperation({
    summary: "Delete a destination by ID",
    description: "Removes a destination from the system. Requires ADMIN role.",
  })
  @ApiParam({ name: "id", description: "Destination UUID", format: "uuid" })
  @ApiNoContentResponse({ description: "Destination deleted successfully." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiForbiddenResponse({ description: "Requires ADMIN role." })
  @ApiNotFoundResponse({ description: "Destination not found." })
  @ApiBadRequestResponse({ description: "Invalid UUID format." })
  async handle(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
    const result = await this.destinationDelete.execute({ destinationId: id });

    if (result.isLeft()) {
      throw new NotFoundException(result.value.message);
    }
  }
}
