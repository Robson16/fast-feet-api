import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { DestinationCreateUseCase } from "@/domain/order/application/use-cases/destination-create.usecase";
import { Roles } from "@/infra/auth/roles-decorator";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import {
  DestinationCreateSchema,
  destinationCreateSchema,
} from "@/infra/http/schemas/destination-create.schema";

@Controller("/destinations")
@ApiTags("Destinations")
@ApiBearerAuth()
export class DestinationCreateController {
  constructor(private destinationCreate: DestinationCreateUseCase) {}

  @Post()
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Create a destination",
    description: "Creates a new destination (address) linked to a recipient.",
  })
  @ApiResponse({
    status: 201,
    description: "Destination created successfully.",
  })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiForbiddenResponse({ description: "Requires ADMIN role." })
  async handle(
    @Body(new ZodValidationPipe(destinationCreateSchema))
    body: DestinationCreateSchema,
  ) {
    const result = await this.destinationCreate.execute(body);

    if (result.isLeft()) {
      throw new BadRequestException();
    }
  }
}
