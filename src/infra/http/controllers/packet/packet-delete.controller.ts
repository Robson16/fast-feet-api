import {
  ConflictException,
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
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Prisma } from "@prisma/client";

import { PacketDeleteUseCase } from "@/domain/order/application/use-cases/packet-delete.usecase";
import { Roles } from "@/infra/auth/roles-decorator";

@Controller("/packets/:id")
@ApiTags("Packets")
@ApiBearerAuth()
export class PacketDeleteController {
  constructor(private packetDelete: PacketDeleteUseCase) {}

  @Delete()
  @Roles("ADMIN")
  @HttpCode(204)
  @ApiOperation({
    summary: "Delete a packet by ID",
    description: "Removes a packet from the system. Requires ADMIN role.",
  })
  @ApiParam({ name: "id", description: "Packet UUID", format: "uuid" })
  @ApiNoContentResponse({ description: "Packet deleted successfully." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiForbiddenResponse({ description: "Requires ADMIN role." })
  @ApiNotFoundResponse({ description: "Packet not found." })
  @ApiBadRequestResponse({ description: "Invalid UUID format." })
  @ApiConflictResponse({
    description: "Packet has related records and cannot be deleted.",
  })
  async handle(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
    try {
      const result = await this.packetDelete.execute({ packetId: id });

      if (result.isLeft()) {
        throw new NotFoundException(result.value.message);
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new ConflictException(
          "Packet cannot be deleted because it has related records.",
        );
      }

      throw error;
    }
  }
}
