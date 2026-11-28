import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { DEFAULT_PER_PAGE } from "@/core/repositories/pagination-params";
import { PacketListNearbyByDelivererUseCase } from "@/domain/order/application/use-cases/packet-list-nearby-by-deliverer.usecase";
import { CurrentUser } from "@/infra/auth/current-user-decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";
import { Roles } from "@/infra/auth/roles-decorator";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import { PacketPresenter } from "@/infra/http/presenters/packet-presenter";
import {
  PacketListNearbyQuerySchema,
  packetListNearbyQuerySchema,
} from "@/infra/http/schemas/packet-list-nearby.schema";

@ApiTags("Packets")
@ApiBearerAuth()
@Controller("/deliverer/packets/nearby")
export class PacketListNearbyController {
  constructor(
    private packetListNearbyByDeliverer: PacketListNearbyByDelivererUseCase,
  ) {}

  @Get()
  @Roles("DELIVERER")
  @ApiOperation({
    summary: "List nearby withdrawn packets for the authenticated deliverer",
    description:
      "Returns a paginated list of WITHDRAWN packets assigned to the authenticated deliverer within the given distance radius (in meters). Requires DELIVERER role.",
  })
  @ApiQuery({
    name: "latitude",
    required: true,
    type: Number,
    example: -23.1857,
  })
  @ApiQuery({
    name: "longitude",
    required: true,
    type: Number,
    example: -46.8978,
  })
  @ApiQuery({
    name: "distance",
    required: false,
    type: Number,
    description: "Search radius in meters (defaults to 5000).",
    example: 5000,
  })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: "Paginated list of nearby packets returned successfully.",
    schema: {
      type: "object",
      properties: {
        packets: { type: "array", items: { type: "object" } },
        page: { type: "number", example: 1 },
        perPage: { type: "number", example: DEFAULT_PER_PAGE },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid query parameters." })
  @ApiResponse({ status: 401, description: "Authentication is required." })
  @ApiResponse({ status: 403, description: "Requires DELIVERER role." })
  async handle(
    @CurrentUser() user: UserPayload,
    @Query(new ZodValidationPipe(packetListNearbyQuerySchema))
    query: PacketListNearbyQuerySchema,
  ) {
    const { page, latitude, longitude, distance } = query;

    const result = await this.packetListNearbyByDeliverer.execute({
      delivererId: user.sub,
      latitude,
      longitude,
      distance,
      page,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }

    return {
      packets: result.value.packets.map(PacketPresenter.toHTTP),
      page,
      perPage: DEFAULT_PER_PAGE,
    };
  }
}
