import { Module } from "@nestjs/common";

import { RegisterUserUseCase } from "@/domain/user/application/use-cases/user-register.usecase";

import { CryptographyModule } from "../cryptography/cryptography.module";
import { DatabaseModule } from "../database/database.module";
import { CreateAccountController } from "./controllers/users/create-account.controller";
import { CreateUserController } from "./controllers/users/create-user.controller";

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [CreateAccountController, CreateUserController],
  providers: [RegisterUserUseCase],
})
export class HttpModule {}
