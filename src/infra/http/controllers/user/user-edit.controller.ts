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
import { z } from "zod";

import { UserEditUseCase } from "@/domain/user/application/use-cases/user-edit.usecase";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { Roles } from "@/infra/auth/roles-decorator";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";

const editUserBodySchema = z.object({
  name: z.string().optional(),
  cpf: z.string().optional(),
  email: z.string().email().optional(),
  role: z
    .string()
    .refine(Role.validate, { message: "Invalid Role" })
    .optional(),
});

type EditUserBodySchema = z.infer<typeof editUserBodySchema>;

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
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "Jane Updated" },
        cpf: { type: "string", example: "111.222.333-44" },
        email: { type: "string", format: "email" },
        role: { type: "string", enum: ["ADMIN", "DELIVERER", "RECIPIENT"] },
      },
    },
  })
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
