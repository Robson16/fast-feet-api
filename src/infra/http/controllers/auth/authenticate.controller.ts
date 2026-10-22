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
import { z } from "zod";

import { WrongCredentialsError } from "@/domain/user/application/use-cases/errors/wrong-credentials-error";
import { UserAuthenticateUseCase } from "@/domain/user/application/use-cases/user-authenticate.usecase";
import { Public } from "@/infra/auth/public";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";

const userAuthenticateBodySchema = z.object({
  cpf: z.string(),
  password: z.string(),
});

type UserAuthenticateBodySchema = z.infer<typeof userAuthenticateBodySchema>;

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
  @ApiBody({
    schema: {
      type: "object",
      required: ["cpf", "password"],
      properties: {
        cpf: { type: "string", example: "111.222.333-44" },
        password: { type: "string", example: "strong-password" },
      },
    },
  })
  @ApiOkResponse({
    description: "Authentication successful.",
    schema: {
      type: "object",
      properties: {
        access_token: { type: "string" },
      },
    },
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
