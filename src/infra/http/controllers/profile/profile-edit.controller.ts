import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
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
import { CurrentUser } from "@/infra/auth/current-user-decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";

const editProfileBodySchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});

type EditProfileBodySchema = z.infer<typeof editProfileBodySchema>;

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
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "Jane Updated" },
        email: { type: "string", format: "email" },
      },
    },
  })
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
      throw new BadRequestException(result.value.message);
    }
  }
}
