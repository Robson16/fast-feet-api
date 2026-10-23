import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { UserListUseCase } from "@/domain/user/application/use-cases/user-list.usecase";
import { USERS_PER_PAGE } from "@/domain/user/application/use-cases/user-list.usecase";
import { Roles } from "@/infra/auth/roles-decorator";
import { UserListResponseDto } from "@/infra/http/dtos/user-response.dto";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import { UserPresenter } from "@/infra/http/presenters/user-presenter";
import {
  UserListQuerySchema,
  userListQuerySchema,
} from "@/infra/http/schemas/user-list-query.schema";

@Controller("/users")
@ApiTags("Users")
@ApiBearerAuth()
export class UserListController {
  constructor(private userList: UserListUseCase) {}

  @Get()
  @Roles("ADMIN")
  @ApiOperation({
    summary: "List users",
    description: "Returns users in pages of 20. Requires ADMIN role.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    example: 1,
    description: "One-based page number.",
  })
  @ApiOkResponse({
    description: "Users retrieved successfully.",
    type: UserListResponseDto,
  })
  @ApiBadRequestResponse({ description: "Page must be a positive integer." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiForbiddenResponse({ description: "Requires ADMIN role." })
  async handle(
    @Query(new ZodValidationPipe(userListQuerySchema))
    query: UserListQuerySchema,
  ) {
    const result = await this.userList.execute({ page: query.page });

    if (result.isLeft()) {
      throw new BadRequestException(result.value);
    }

    return {
      users: result.value.users.map(UserPresenter.toHTTP),
      page: query.page,
      perPage: USERS_PER_PAGE,
    };
  }
}
