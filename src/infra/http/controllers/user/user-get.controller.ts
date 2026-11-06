import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { UserGetUseCase } from "@/domain/user/application/use-cases/user-get.usecase";
import { Roles } from "@/infra/auth/roles-decorator";
import { UserDetailsResponseDto } from "@/infra/http/dtos/user-response.dto";
import { UserPresenter } from "@/infra/http/presenters/user-presenter";

@Controller("/users/:id")
@ApiTags("Users")
@ApiBearerAuth()
export class UserGetController {
  constructor(private userGet: UserGetUseCase) {}

  @Get()
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Get a user by ID",
    description: "Returns a user's profile. Requires ADMIN role.",
  })
  @ApiParam({ name: "id", description: "User UUID", format: "uuid" })
  @ApiOkResponse({
    description: "User retrieved successfully.",
    type: UserDetailsResponseDto,
  })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiForbiddenResponse({ description: "Requires ADMIN role." })
  @ApiNotFoundResponse({ description: "User not found." })
  async handle(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
    const result = await this.userGet.execute({ userId: id });

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
      user: UserPresenter.toHTTP(result.value.user),
    };
  }
}
