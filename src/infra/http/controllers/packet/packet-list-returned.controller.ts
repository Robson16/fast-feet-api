import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { DEFAULT_PER_PAGE } from "@/core/repositories/pagination-params";
import { PacketListReturnedUseCase } from "@/domain/order/application/use-cases/packet-list-returned.usecase";
import { Roles } from "@/infra/auth/roles-decorator";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import { PacketPresenter } from "@/infra/http/presenters/packet-presenter";
import {
  PacketAddressFiltersQuerySchema,
  packetAddressFiltersQuerySchema,
} from "@/infra/http/schemas/packet-address-filters.schema";

@ApiTags("Packets")
@ApiBearerAuth()
@Controller("/packets/returned")
export class PacketListReturnedController {
  constructor(private packetListReturned: PacketListReturnedUseCase) {}

  @Get()
  @Roles("ADMIN")
  @ApiOperation({ summary: "List returned packets (Admin only)" })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
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
    description: "Paginated list of returned packets",
  })
  @ApiResponse({ status: 400, description: "Invalid query parameters" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async handle(
    @Query(new ZodValidationPipe(packetAddressFiltersQuerySchema))
    query: PacketAddressFiltersQuerySchema,
  ) {
    const { page, state, city, neighborhood } = query;

    const result = await this.packetListReturned.execute({
      page,
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
