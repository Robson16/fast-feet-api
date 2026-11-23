import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { PacketGetUseCase } from "@/domain/order/application/use-cases/packet-get.usecase";
import { CurrentUser } from "@/infra/auth/current-user-decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";
import { PacketDetailsPresenter } from "@/infra/http/presenters/packet-details-presenter";

@Controller("/packets/:id")
@ApiTags("Packets")
@ApiBearerAuth()
export class PacketGetController {
  constructor(private packetGet: PacketGetUseCase) {}

  @Get()
  @ApiOperation({
    summary: "Get a packet by ID",
    description:
      "Returns details of a specific packet. ADMIN can view any packet, RECIPIENT only packets linked to their destination, and DELIVERER only packets assigned to them.",
  })
  @ApiParam({ name: "id", description: "Packet UUID", format: "uuid" })
  @ApiOkResponse({ description: "Packet retrieved successfully." })
  @ApiBadRequestResponse({ description: "Invalid UUID format." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiNotFoundResponse({ description: "Packet not found." })
  async handle(
    @CurrentUser() user: UserPayload,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
  ) {
    const result = await this.packetGet.execute({
      packetId: id,
      userId: user.sub,
      userRole: user.role,
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

    return {
      packet: PacketDetailsPresenter.toHTTP(result.value.packet),
    };
  }
}
