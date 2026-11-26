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
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { MAX_DELIVERY_PHOTO_SIZE_BYTES } from "@/domain/order/application/storage/validate-delivery-photo";
import { InvalidDeliveryPhotoError } from "@/domain/order/application/use-cases/errors/invalid-delivery-photo-error";
import { UnavailablePacketError } from "@/domain/order/application/use-cases/errors/unavailable-packet-error";
import { PacketUpdateStatusToDeliveredUseCase } from "@/domain/order/application/use-cases/packet-update-status-to-delivered.usecase";
import { CurrentUser } from "@/infra/auth/current-user-decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";
import { Roles } from "@/infra/auth/roles-decorator";
import { PacketPresenter } from "@/infra/http/presenters/packet-presenter";

class UploadDeliveryPhotoDto {
  @ApiProperty({
    type: "string",
    format: "binary",
    description: "Delivery proof photo (JPEG, PNG, or WebP, max 5 MB).",
  })
  file!: Express.Multer.File;
}

@ApiTags("Packets")
@ApiBearerAuth()
@Controller("/packets/:id/delivered")
export class PacketDeliveredController {
  constructor(
    private packetUpdateStatusToDelivered: PacketUpdateStatusToDeliveredUseCase,
  ) {}

  @Post()
  @Roles("DELIVERER")
  @HttpCode(200)
  @ApiOperation({
    summary: "Mark a packet as delivered",
    description:
      "Uploads a delivery proof photo (JPEG, PNG, or WebP up to 5 MB) and updates the packet status to DELIVERED. Restricted to the DELIVERER who withdrew the packet.",
  })
  @ApiParam({
    name: "id",
    description: "Packet UUID",
    schema: { type: "string", format: "uuid" },
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Delivery proof image file",
    type: UploadDeliveryPhotoDto,
  })
  @ApiResponse({
    status: 200,
    description: "Packet marked as delivered successfully.",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid UUID format, missing photo, or invalid image file.",
  })
  @ApiResponse({
    status: 401,
    description: "Authentication is required.",
  })
  @ApiResponse({
    status: 403,
    description:
      "Only the DELIVERER who withdrew this packet can mark it as delivered.",
  })
  @ApiResponse({
    status: 404,
    description: "Packet not found.",
  })
  @ApiResponse({
    status: 409,
    description: "Packet is already delivered or not withdrawn for delivery.",
  })
  @ApiResponse({
    status: 413,
    description: "Delivery photo exceeds the maximum allowed size of 5 MB.",
  })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_DELIVERY_PHOTO_SIZE_BYTES },
    }),
  )
  async handle(
    @CurrentUser() user: UserPayload,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("Delivery photo is required.");
    }

    const result = await this.packetUpdateStatusToDelivered.execute({
      packetId: id,
      delivererId: user.sub,
      photo: {
        fileName: file.originalname,
        body: file.buffer,
      },
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
        case InvalidDeliveryPhotoError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return {
      packet: PacketPresenter.toHTTP(result.value.packet),
    };
  }
}
