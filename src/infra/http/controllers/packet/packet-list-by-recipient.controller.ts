import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import {
  PacketListByRecipientUseCase,
  PACKETS_PER_PAGE,
} from "@/domain/order/application/use-cases/packet-list-by-recipient.usecase";
import { CurrentUser } from "@/infra/auth/current-user-decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";
import { Roles } from "@/infra/auth/roles-decorator";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import { PacketPresenter } from "@/infra/http/presenters/packet-presenter";
import {
  PacketListByRecipientQuerySchema,
  packetListByRecipientQuerySchema,
} from "@/infra/http/schemas/packet-list-by-recipient.schema";

@Controller("/packets")
@ApiTags("Packets")
@ApiBearerAuth()
export class PacketListByRecipientController {
  constructor(private packetListByRecipient: PacketListByRecipientUseCase) {}

  @Get()
  @Roles("RECIPIENT")
  @ApiOperation({
    summary: "List user's parcels",
    description:
      "Returns a paginated list of parcels belonging to the authenticated recipient.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (defaults to 1)",
  })
  @ApiResponse({ status: 200, description: "Parcels retrieved successfully." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiForbiddenResponse({ description: "Requires RECIPIENT role." })
  async handle(
    @CurrentUser() user: UserPayload,
    @Query(new ZodValidationPipe(packetListByRecipientQuerySchema))
    query: PacketListByRecipientQuerySchema,
  ) {
    const result = await this.packetListByRecipient.execute({
      page: query.page,
      recipientId: user.sub,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }

    const { packets } = result.value;

    return {
      packets: packets.map(PacketPresenter.toHTTP),
      page: query.page,
      perPage: PACKETS_PER_PAGE,
    };
  }
}
