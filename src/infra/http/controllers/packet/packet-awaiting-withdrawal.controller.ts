import {
  BadRequestException,
  ConflictException,
  Controller,
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
import { PacketUpdateStatusToAwaitingWithdrawalUseCase } from "@/domain/order/application/use-cases/packet-update-status-to-awaiting-withdrawal.usecase";
import { Roles } from "@/infra/auth/roles-decorator";
import { PacketPresenter } from "@/infra/http/presenters/packet-presenter";

@Controller("/packets/:id/awaiting-withdrawal")
@ApiTags("Packets")
@ApiBearerAuth()
export class PacketAwaitingWithdrawalController {
  constructor(
    private packetUpdateStatusToAwaitingWithdrawal: PacketUpdateStatusToAwaitingWithdrawalUseCase,
  ) {}

  @Post()
  @Roles("ADMIN")
  @HttpCode(200)
  @ApiOperation({
    summary: "Reopen a packet as awaiting withdrawal",
    description:
      "Updates a packet status back to AWAITING_WITHDRAWAL and clears its assigned deliverer. Restricted to ADMIN users.",
  })
  @ApiParam({ name: "id", description: "Packet UUID", format: "uuid" })
  @ApiOkResponse({
    description: "Packet marked as awaiting withdrawal successfully.",
  })
  @ApiBadRequestResponse({ description: "Invalid UUID format." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiForbiddenResponse({ description: "Only ADMIN users can reopen packets." })
  @ApiNotFoundResponse({ description: "Packet not found." })
  @ApiConflictResponse({
    description:
      "Packet is already awaiting withdrawal or has already been delivered.",
  })
  async handle(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
    const result = await this.packetUpdateStatusToAwaitingWithdrawal.execute({
      packetId: id,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case NotAllowedError:
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
