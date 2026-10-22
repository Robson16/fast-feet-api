import { Module } from "@nestjs/common";

import { UserAuthenticateUseCase } from "@/domain/user/application/use-cases/user-authenticate.usecase";
import { UserDeleteUseCase } from "@/domain/user/application/use-cases/user-delete.usecase";
import { UserEditUseCase } from "@/domain/user/application/use-cases/user-edit.usecase";
import { UserRegisterUseCase } from "@/domain/user/application/use-cases/user-register.usecase";

import { CryptographyModule } from "../cryptography/cryptography.module";
import { DatabaseModule } from "../database/database.module";
import { AccountRegisterController } from "./controllers/account/account-register.controller";
import { UserAuthenticateController } from "./controllers/auth/authenticate.controller";
import { ProfileEditController } from "./controllers/profile/profile-edit.controller";
import { UserCreateController } from "./controllers/user/user-create.controller";
import { UserDeleteController } from "./controllers/user/user-delete.controller";
import { UserEditController } from "./controllers/user/user-edit.controller";

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    AccountRegisterController,
    UserCreateController,
    UserAuthenticateController,
    UserEditController,
    UserDeleteController,
    ProfileEditController,
  ],
  providers: [
    UserRegisterUseCase,
    UserAuthenticateUseCase,
    UserEditUseCase,
    UserDeleteUseCase,
  ],
})
export class HttpModule {}
