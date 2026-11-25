import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { UnavailablePacketError } from "@/domain/order/application/use-cases/errors/unavailable-packet-error";
import { PacketUpdateStatusToWithdrawnUseCase } from "@/domain/order/application/use-cases/packet-update-status-to-withdrawn.usecase";
import { CurrentUser } from "@/infra/auth/current-user-decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";
import { Roles } from "@/infra/auth/roles-decorator";
import { PacketPresenter } from "@/infra/http/presenters/packet-presenter";

@Controller("/packets/:id/withdrawal")
@ApiTags("Packets")
@ApiBearerAuth()
export class PacketWithdrawalController {
  constructor(
    private packetUpdateStatusToWithdrawn: PacketUpdateStatusToWithdrawnUseCase,
  ) {}

  @Post()
  @Roles("DELIVERER")
  @HttpCode(200)
  @ApiOperation({
    summary: "Withdraw a packet",
    description:
      "Assigns the authenticated DELIVERER to a packet awaiting withdrawal and updates its status to WITHDRAWN.",
  })
  @ApiParam({ name: "id", description: "Packet UUID", format: "uuid" })
  @ApiOkResponse({ description: "Packet withdrawn successfully." })
  @ApiBadRequestResponse({ description: "Invalid UUID format." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiForbiddenResponse({
    description: "Only DELIVERER users can withdraw packets.",
  })
  @ApiNotFoundResponse({ description: "Packet or deliverer not found." })
  @ApiConflictResponse({
    description: "Packet is not available for withdrawal.",
  })
  async handle(
    @CurrentUser() user: UserPayload,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
  ) {
    const result = await this.packetUpdateStatusToWithdrawn.execute({
      delivererId: user.sub,
      packetId: id,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case NotAllowedError:
          throw new ForbiddenException(error.message);
        case UnavailablePacketError:
          throw new ConflictException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return {
      packet: PacketPresenter.toHTTP(result.value.packet),
    };
  }
}
