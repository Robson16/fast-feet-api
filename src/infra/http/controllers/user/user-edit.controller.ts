import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Put,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { InvalidCPFError } from "@/domain/user/application/use-cases/errors/invalid-cpf-error";
import { InvalidUserRole } from "@/domain/user/application/use-cases/errors/invalid-user-role";
import { UserAlreadyExistsError } from "@/domain/user/application/use-cases/errors/user-already-exists-error";
import { UserEditUseCase } from "@/domain/user/application/use-cases/user-edit.usecase";
import { Roles } from "@/infra/auth/roles-decorator";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import {
  editUserApiBody,
  EditUserBodySchema,
  editUserBodySchema,
} from "@/infra/http/schemas/user-edit.schema";

@Controller("/users/:id")
@ApiTags("Users")
@ApiBearerAuth()
export class UserEditController {
  constructor(private userEdit: UserEditUseCase) {}

  @Put()
  @Roles("ADMIN")
  @HttpCode(204)
  @ApiOperation({
    summary: "Edit a user",
    description: "Updates user details and role. Requires ADMIN role.",
  })
  @ApiBody(editUserApiBody)
  @ApiNoContentResponse({ description: "User updated successfully." })
  @ApiBadRequestResponse({ description: "Invalid data or CPF." })
  @ApiNotFoundResponse({ description: "User not found." })
  @ApiConflictResponse({ description: "CPF or email is already in use." })
  async handle(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body(new ZodValidationPipe(editUserBodySchema)) body: EditUserBodySchema,
  ) {
    const { name, cpf, email, role } = body;

    const result = await this.userEdit.execute({
      userId: id,
      name,
      cpf,
      email,
      role,
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
