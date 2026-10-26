import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Patch,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { WrongCredentialsError } from "@/domain/user/application/use-cases/errors/wrong-credentials-error";
import { UserChangePasswordUseCase } from "@/domain/user/application/use-cases/user-change-password.usecase.ts";
import { CurrentUser } from "@/infra/auth/current-user-decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import {
  profileChangePasswordApiBody,
  ProfileChangePasswordBodySchema,
  profileChangePasswordBodySchema,
} from "@/infra/http/schemas/profile-change-password.schema";

@Controller("/profile")
@ApiTags("Profile")
@ApiBearerAuth()
export class ProfileChangePasswordController {
  constructor(private profileChangePassword: UserChangePasswordUseCase) {}

  @Patch("password")
  @HttpCode(204)
  @ApiOperation({
    summary: "Change the authenticated user's password",
    description:
      "Verifies the current password and replaces it with the new password. " +
      "The account is identified from the authenticated user's JWT.",
  })
  @ApiBody(profileChangePasswordApiBody)
  @ApiNoContentResponse({ description: "Password changed successfully." })
  @ApiBadRequestResponse({ description: "Invalid request body." })
  @ApiUnauthorizedResponse({
    description:
      "Authentication is required or the current password is incorrect.",
  })
  @ApiNotFoundResponse({ description: "Authenticated user was not found." })
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(new ZodValidationPipe(profileChangePasswordBodySchema))
    body: ProfileChangePasswordBodySchema,
  ) {
    const { currentPassword, newPassword } = body;

    const result = await this.profileChangePassword.execute({
      userId: user.sub,
      currentPassword,
      newPassword,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case WrongCredentialsError:
          throw new UnauthorizedException(error.message);
        default:
          throw new BadRequestException("An unexpected error occurred.");
      }
    }
  }
}
