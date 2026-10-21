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
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { z } from "zod";

import { UserAlreadyExistsError } from "@/domain/user/application/use-cases/errors/user-already-exists-error";
import { RegisterUserUseCase } from "@/domain/user/application/use-cases/user-register.usecase";
import { Roles } from "@/infra/auth/roles-decorator";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";

const createUserBodySchema = z.object({
  name: z.string(),
  cpf: z.string(),
  email: z.string().email(),
  password: z.string(),
  role: z.enum(["ADMIN", "DELIVERER", "RECIPIENT"]).default("DELIVERER"),
});

type CreateUserBodySchema = z.infer<typeof createUserBodySchema>;

@Controller("/users")
@ApiTags("Users")
@ApiBearerAuth()
export class CreateUserController {
  constructor(private registerUser: RegisterUserUseCase) {}

  @Post()
  @Roles("ADMIN")
  @HttpCode(201)
  @ApiOperation({
    summary: "Create a new user internally",
    description:
      "Authenticated route for administrators to create any user role (ADMIN, DELIVERER, or RECIPIENT).",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["name", "cpf", "email", "password", "role"],
      properties: {
        name: { type: "string", example: "Jane Admin" },
        cpf: { type: "string", example: "111.222.333-44" },
        email: {
          type: "string",
          format: "email",
          example: "jane@fastfeet.com",
        },
        password: { type: "string", example: "strong-password" },
        role: { type: "string", enum: ["ADMIN", "DELIVERER", "RECIPIENT"] },
      },
    },
  })
  @ApiCreatedResponse({ description: "User created successfully." })
  @ApiBadRequestResponse({ description: "Invalid data or invalid CPF." })
  @ApiConflictResponse({ description: "User already exists." })
  @UsePipes(new ZodValidationPipe(createUserBodySchema))
  async handle(@Body() body: CreateUserBodySchema) {
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
