import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { PacketCreateUseCase } from "@/domain/order/application/use-cases/packet-create.usecase";
import { Roles } from "@/infra/auth/roles-decorator";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import { PacketPresenter } from "@/infra/http/presenters/packet-presenter";
import {
  packetCreateApiBody,
  PacketCreateBodySchema,
  packetCreateBodySchema,
} from "@/infra/http/schemas/packet-create.schema";

@Controller("/packets")
@ApiTags("Packets")
@ApiBearerAuth()
export class PacketCreateController {
  constructor(private packetCreate: PacketCreateUseCase) {}

  @Post()
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Create a packet",
    description: "Creates a new packet linked to a destination.",
  })
  @ApiBody(packetCreateApiBody)
  @ApiCreatedResponse({
    description: "Packet created successfully.",
  })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiBadRequestResponse({ description: "Invalid input data." })
  @ApiForbiddenResponse({ description: "Requires ADMIN role." })
  @ApiNotFoundResponse({ description: "Destination not found." })
  async handle(
    @Body(new ZodValidationPipe(packetCreateBodySchema))
    body: PacketCreateBodySchema,
  ) {
    const result = await this.packetCreate.execute(body);

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
      packet: PacketPresenter.toHTTP(result.value.packet),
    };
  }
}
