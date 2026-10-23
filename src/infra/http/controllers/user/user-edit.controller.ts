import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
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
  async handle(
    @Param("id") id: string,
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
      throw new BadRequestException(result.value.message);
    }
  }
}
