import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { PacketGetDeliveryPhotoUseCase } from "@/domain/order/application/use-cases/packet-get-delivery-photo.usecase";
import { CurrentUser } from "@/infra/auth/current-user-decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";

@ApiTags("Packets")
@ApiBearerAuth()
@Controller("/packets/:id/delivery-photo")
export class PacketGetDeliveryPhotoController {
  constructor(private packetGetDeliveryPhoto: PacketGetDeliveryPhotoUseCase) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: "Get delivery proof photo URL",
    description:
      "Returns a temporary presigned URL for a packet's delivery proof photo. ADMIN can access any packet, RECIPIENT only packets linked to their destination, and DELIVERER only packets assigned to them.",
  })
  @ApiParam({
    name: "id",
    description: "Packet UUID",
    schema: { type: "string", format: "uuid" },
  })
  @ApiResponse({
    status: 200,
    description: "Presigned URL generated successfully.",
    schema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          format: "uri",
          example: "https://storage.example.com/photo-key?X-Amz-Signature=...",
        },
        expiresIn: {
          type: "number",
          example: 300,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid UUID format.",
  })
  @ApiResponse({
    status: 401,
    description: "Authentication is required.",
  })
  @ApiResponse({
    status: 404,
    description: "Packet or delivery photo not found.",
  })
  async handle(
    @CurrentUser() user: UserPayload,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
  ) {
    const result = await this.packetGetDeliveryPhoto.execute({
      packetId: id,
      requesterId: user.sub,
      requesterRole: user.role,
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
      url: result.value.url,
      expiresIn: result.value.expiresIn,
    };
  }
}
