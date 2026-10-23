import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { UserDeleteUseCase } from "@/domain/user/application/use-cases/user-delete.usecase";
import { CurrentUser } from "@/infra/auth/current-user-decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";

@Controller("/profile")
@ApiTags("Profile")
@ApiBearerAuth()
export class ProfileDeleteController {
  constructor(private userDelete: UserDeleteUseCase) {}

  @Delete()
  @HttpCode(204)
  @ApiOperation({
    summary: "Delete own profile",
    description: "Deletes the authenticated user's account.",
  })
  @ApiNoContentResponse({ description: "Profile deleted successfully." })
  @ApiNotFoundResponse({ description: "Authenticated user was not found." })
  @ApiBadRequestResponse({ description: "An unexpected error occurred." })
  async handle(@CurrentUser() user: UserPayload) {
    const result = await this.userDelete.execute({
      userId: user.sub,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException("An unexpected error occurred.");
      }
    }
  }
}
