import { Module } from "@nestjs/common";

import { UserAuthenticateUseCase } from "@/domain/user/application/use-cases/user-authenticate.usecase";
import { UserRegisterUseCase } from "@/domain/user/application/use-cases/user-register.usecase";

import { CryptographyModule } from "../cryptography/cryptography.module";
import { DatabaseModule } from "../database/database.module";
import { UserAuthenticateController } from "./controllers/users/user-authenticate.controller";
import { UserCreateController } from "./controllers/users/user-create.controller";
import { UserRegisterController } from "./controllers/users/user-register.controller";

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    UserRegisterController,
    UserCreateController,
    UserAuthenticateController,
  ],
  providers: [UserRegisterUseCase, UserAuthenticateUseCase],
})
export class HttpModule {}
