import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { DEFAULT_PER_PAGE } from "@/core/repositories/pagination-params";
import { PacketListAdminUseCase } from "@/domain/order/application/use-cases/packet-list-admin.usecase";
import { Roles } from "@/infra/auth/roles-decorator";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import { PacketPresenter } from "@/infra/http/presenters/packet-presenter";
import {
  PacketListAdminQuerySchema,
  packetListAdminQuerySchema,
} from "@/infra/http/schemas/packet-list-admin.schema";

@ApiTags("Packets")
@ApiBearerAuth()
@Controller("/admin/packets")
export class PacketListAdminController {
  constructor(private packetListAdmin: PacketListAdminUseCase) {}

  @Get()
  @Roles("ADMIN")
  @ApiOperation({
    summary: "List all packets with operational filters (Admin only)",
    description:
      "Returns a paginated list of packets with optional filters by status, deliverer, recipient, and address. Requires ADMIN role.",
  })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["AWAITING_WITHDRAWAL", "WITHDRAWN", "DELIVERED", "RETURNED"],
  })
  @ApiQuery({ name: "delivererId", required: false, type: String })
  @ApiQuery({ name: "recipientId", required: false, type: String })
  @ApiQuery({ name: "state", required: false, type: String, example: "SP" })
  @ApiQuery({ name: "city", required: false, type: String, example: "Jundiaí" })
  @ApiQuery({
    name: "neighborhood",
    required: false,
    type: String,
    example: "Centro",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated list of packets returned successfully.",
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
  @ApiResponse({ status: 403, description: "Requires ADMIN role." })
  async handle(
    @Query(new ZodValidationPipe(packetListAdminQuerySchema))
    query: PacketListAdminQuerySchema,
  ) {
    const {
      page,
      status,
      delivererId,
      recipientId,
      state,
      city,
      neighborhood,
    } = query;

    const result = await this.packetListAdmin.execute({
      page,
      status,
      delivererId,
      recipientId,
      state,
      city,
      neighborhood,
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
