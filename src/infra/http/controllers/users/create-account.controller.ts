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
import { z } from "zod";

import { UserAlreadyExistsError } from "@/domain/user/application/use-cases/errors/user-already-exists-error";
import { RegisterUserUseCase } from "@/domain/user/application/use-cases/user-register.usecase";
import { Public } from "@/infra/auth/public";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";

const createAccountBodySchema = z.object({
  name: z.string(),
  cpf: z.string(),
  email: z.string().email(),
  password: z.string(),
  role: z.string().optional().default("DELIVERER"),
});

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>;

@Controller("/accounts")
@ApiTags("Accounts")
@Public()
export class CreateAccountController {
  constructor(private registerUser: RegisterUserUseCase) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: "Create a user account",
    description:
      "Creates an account with a name, CPF, email, password, and role.",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["name", "cpf", "email", "password"],
      properties: {
        name: { type: "string", example: "John Doe" },
        cpf: { type: "string", example: "529.982.247-25" },
        email: {
          type: "string",
          format: "email",
          example: "john.doe@example.com",
        },
        password: { type: "string", example: "strong-password" },
        role: {
          type: "string",
          enum: ["ADMIN", "DELIVERER", "RECIPIENT"],
          default: "DELIVERER",
        },
      },
    },
  })
  @ApiCreatedResponse({ description: "Account created successfully." })
  @ApiBadRequestResponse({
    description: "Invalid data, invalid CPF, or unsupported role.",
  })
  @ApiConflictResponse({
    description: "An account with the provided details already exists.",
  })
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async handle(@Body() body: CreateAccountBodySchema) {
    const { name, cpf, email, password, role } = body;

    const result = await this.registerUser.execute({
      name,
      cpf,
      email,
      password,
      role,
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
