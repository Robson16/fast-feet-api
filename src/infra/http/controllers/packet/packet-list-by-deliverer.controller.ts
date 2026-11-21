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
import { PacketListByDelivererUseCase } from "@/domain/order/application/use-cases/packet-list-by-deliverer.usecase";
import { CurrentUser } from "@/infra/auth/current-user-decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";
import { Roles } from "@/infra/auth/roles-decorator";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import { PacketPresenter } from "@/infra/http/presenters/packet-presenter";
import {
  PacketListByDelivererQuerySchema,
  packetListByDelivererQuerySchema,
} from "@/infra/http/schemas/packet-list-by-deliverer.schema";

@Controller("/deliverer/packets")
@ApiTags("Packets")
@ApiBearerAuth()
export class PacketListByDelivererController {
  constructor(private packetListByDeliverer: PacketListByDelivererUseCase) {}

  @Get()
  @Roles("DELIVERER")
  @ApiOperation({
    summary: "List deliverer's packets",
    description:
      "Returns a paginated list of packets assigned to the authenticated deliverer. Requires DELIVERER role.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number for pagination (minimum 1, defaults to 1).",
    example: 1,
  })
  @ApiOkResponse({
    description: "Paginated list of packets returned successfully.",
    schema: {
      type: "object",
      properties: {
        packets: {
          type: "array",
          items: { type: "object" },
        },
        page: { type: "number", example: 1 },
        perPage: { type: "number", example: DEFAULT_PER_PAGE },
      },
    },
  })
  @ApiBadRequestResponse({ description: "Invalid query parameters." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiForbiddenResponse({ description: "Requires DELIVERER role." })
  async handle(
    @CurrentUser() user: UserPayload,
    @Query(new ZodValidationPipe(packetListByDelivererQuerySchema))
    query: PacketListByDelivererQuerySchema,
  ) {
    const result = await this.packetListByDeliverer.execute({
      page: query.page,
      delivererId: user.sub,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }

    const { packets } = result.value;

    return {
      packets: packets.map(PacketPresenter.toHTTP),
      page: query.page,
      perPage: DEFAULT_PER_PAGE,
    };
  }
}
