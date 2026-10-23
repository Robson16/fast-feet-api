import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { UserGetUseCase } from "@/domain/user/application/use-cases/user-get.usecase";
import { CurrentUser } from "@/infra/auth/current-user-decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";
import { UserDetailsResponseDto } from "@/infra/http/dtos/user-response.dto";
import { UserPresenter } from "@/infra/http/presenters/user-presenter";

@ApiTags("Profile")
@Controller("/profile")
@ApiBearerAuth()
export class UserGetProfileController {
  constructor(private getUserProfileUseCase: UserGetUseCase) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: "Get the profile of the currently authenticated user.",
  })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved.",
    type: UserDetailsResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 404, description: "User not found." })
  async handle(@CurrentUser() user: UserPayload) {
    const result = await this.getUserProfileUseCase.execute({
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

    return {
      user: UserPresenter.toHTTP(result.value.user),
    };
  }
}
