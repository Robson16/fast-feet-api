import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UsePipes,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { UserAlreadyExistsError } from "@/domain/user/application/use-cases/errors/user-already-exists-error";
import { UserRegisterUseCase } from "@/domain/user/application/use-cases/user-register.usecase";
import { Public } from "@/infra/auth/public";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import {
  accountRegisterApiBody,
  AccountRegisterBodySchema,
  accountRegisterBodySchema,
} from "@/infra/http/schemas/account-register.schema";

@Controller("/accounts")
@ApiTags("Accounts")
@Public()
export class AccountRegisterController {
  constructor(private accountRegister: UserRegisterUseCase) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: "Create a user account",
    description: "Creates an account with a name, CPF, email, password.",
  })
  @ApiBody(accountRegisterApiBody)
  @ApiCreatedResponse({ description: "Account created successfully." })
  @ApiBadRequestResponse({
    description: "Invalid data, invalid CPF.",
  })
  @ApiConflictResponse({
    description: "An account with the provided details already exists.",
  })
  @UsePipes(new ZodValidationPipe(accountRegisterBodySchema))
  async handle(@Body() body: AccountRegisterBodySchema) {
    const { name, cpf, email, password } = body;

    const result = await this.accountRegister.execute({
      name,
      cpf,
      email,
      password,
      role: "DELIVERER",
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case UserAlreadyExistsError:
          throw new ConflictException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }
  }
}
