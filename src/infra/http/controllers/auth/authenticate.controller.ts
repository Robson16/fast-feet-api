import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
  UsePipes,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { WrongCredentialsError } from "@/domain/user/application/use-cases/errors/wrong-credentials-error";
import { UserAuthenticateUseCase } from "@/domain/user/application/use-cases/user-authenticate.usecase";
import { Public } from "@/infra/auth/public";
import { AuthenticateResponseDto } from "@/infra/http/dtos/authenticate-response.dto";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import {
  userAuthenticateApiBody,
  UserAuthenticateBodySchema,
  userAuthenticateBodySchema,
} from "@/infra/http/schemas/authenticate-request.schema";

@Controller("/auth")
@ApiTags("Authentication")
@Public()
export class UserAuthenticateController {
  constructor(private userAuthenticate: UserAuthenticateUseCase) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: "Authenticate a user",
    description:
      "Authenticates a user with CPF and password, returning a JWT token.",
  })
  @ApiBody(userAuthenticateApiBody)
  @ApiOkResponse({
    description: "Authentication successful.",
    type: AuthenticateResponseDto,
  })
  @ApiUnauthorizedResponse({ description: "Wrong credentials." })
  @ApiBadRequestResponse({ description: "Invalid input data." })
  @UsePipes(new ZodValidationPipe(userAuthenticateBodySchema))
  async handle(@Body() body: UserAuthenticateBodySchema) {
    const { cpf, password } = body;

    const result = await this.userAuthenticate.execute({
      cpf,
      password,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case WrongCredentialsError:
          throw new UnauthorizedException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return {
      access_token: result.value.accessToken,
    };
  }
}
