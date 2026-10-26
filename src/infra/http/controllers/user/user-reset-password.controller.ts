import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { UserResetPasswordUseCase } from "@/domain/user/application/use-cases/user-reset-password.usecase";
import { Roles } from "@/infra/auth/roles-decorator";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import {
  userResetPasswordApiBody,
  UserResetPasswordBodySchema,
  userResetPasswordBodySchema,
} from "@/infra/http/schemas/user-reset-password.schema";

@Controller("/users/:id")
@ApiTags("Users")
@ApiBearerAuth()
export class UserResetPasswordController {
  constructor(private userResetPassword: UserResetPasswordUseCase) {}

  @Patch("password")
  @Roles("ADMIN")
  @HttpCode(204)
  @ApiOperation({
    summary: "Force reset a user's password",
    description:
      "Allows an administrator to overwrite the password of any user without knowing their current password. Requires ADMIN role.",
  })
  @ApiParam({
    name: "id",
    description: "The UUID of the user to have their password reset",
    type: "string",
    format: "uuid",
  })
  @ApiBody(userResetPasswordApiBody)
  @ApiNoContentResponse({ description: "Password reset successfully." })
  @ApiBadRequestResponse({ description: "Invalid request body format." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiForbiddenResponse({ description: "Requires ADMIN role." })
  @ApiNotFoundResponse({ description: "Target user was not found." })
  async handle(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(userResetPasswordBodySchema))
    body: UserResetPasswordBodySchema,
  ) {
    const { newPassword } = body;

    const result = await this.userResetPassword.execute({
      userId: id,
      password: newPassword,
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
