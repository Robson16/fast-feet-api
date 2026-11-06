import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  NotFoundException,
  Put,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { InvalidCPFError } from "@/domain/user/application/use-cases/errors/invalid-cpf-error";
import { InvalidUserRole } from "@/domain/user/application/use-cases/errors/invalid-user-role";
import { UserAlreadyExistsError } from "@/domain/user/application/use-cases/errors/user-already-exists-error";
import { UserEditUseCase } from "@/domain/user/application/use-cases/user-edit.usecase";
import { CurrentUser } from "@/infra/auth/current-user-decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import {
  editProfileApiBody,
  EditProfileBodySchema,
  editProfileBodySchema,
} from "@/infra/http/schemas/profile-edit.schema";

@Controller("/profile")
@ApiTags("Profile")
@ApiBearerAuth()
export class ProfileEditController {
  constructor(private userEdit: UserEditUseCase) {}

  @Put()
  @HttpCode(204)
  @ApiOperation({
    summary: "Edit own profile",
    description: "Updates the authenticated user's details.",
  })
  @ApiBody(editProfileApiBody)
  @ApiNoContentResponse({ description: "Profile updated successfully." })
  @ApiBadRequestResponse({ description: "Invalid data." })
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(new ZodValidationPipe(editProfileBodySchema))
    body: EditProfileBodySchema,
  ) {
    const { name, email } = body;

    const result = await this.userEdit.execute({
      userId: user.sub,
      name,
      email,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case UserAlreadyExistsError:
          throw new ConflictException(error.message);
        case InvalidCPFError:
          throw new BadRequestException(error.message);
        case InvalidUserRole:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }
  }
}
