import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
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
  async handle(@Param("id") id: string) {
    const result = await this.userDelete.execute({
      userId: id,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }
  }
}
