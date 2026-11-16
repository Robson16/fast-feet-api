import {
  Controller,
  Delete,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { UserDeleteUseCase } from "@/domain/user/application/use-cases/user-delete.usecase";
import { Roles } from "@/infra/auth/roles-decorator";

@Controller("/users/:id")
@ApiTags("Users")
@ApiBearerAuth()
export class UserDeleteController {
  constructor(private userDelete: UserDeleteUseCase) {}

  @Delete()
  @Roles("ADMIN")
  @HttpCode(204)
  @ApiOperation({
    summary: "Delete a user",
    description: "Removes a user from the system. Requires ADMIN role.",
  })
  @ApiNoContentResponse({ description: "User deleted successfully." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiForbiddenResponse({ description: "Requires ADMIN role." })
  @ApiNotFoundResponse({ description: "User not found." })
  @ApiBadRequestResponse({ description: "Invalid UUID format." })
  async handle(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
    const result = await this.userDelete.execute({
      userId: id,
    });

    if (result.isLeft()) {
      throw new NotFoundException(result.value.message);
    }
  }
}
