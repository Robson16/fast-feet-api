import { Module } from "@nestjs/common";

import { UserAuthenticateUseCase } from "@/domain/user/application/use-cases/user-authenticate.usecase";
import { UserDeleteUseCase } from "@/domain/user/application/use-cases/user-delete.usecase";
import { UserEditUseCase } from "@/domain/user/application/use-cases/user-edit.usecase";
import { UserGetUseCase } from "@/domain/user/application/use-cases/user-get.usecase";
import { UserListUseCase } from "@/domain/user/application/use-cases/user-list.usecase";
import { UserRegisterUseCase } from "@/domain/user/application/use-cases/user-register.usecase";

import { CryptographyModule } from "../cryptography/cryptography.module";
import { DatabaseModule } from "../database/database.module";
import { AccountRegisterController } from "./controllers/account/account-register.controller";
import { UserAuthenticateController } from "./controllers/auth/authenticate.controller";
import { ProfileDeleteController } from "./controllers/profile/profile-delete.controller";
import { ProfileEditController } from "./controllers/profile/profile-edit.controller";
import { UserGetProfileController } from "./controllers/profile/profile-get.controller";
import { UserCreateController } from "./controllers/user/user-create.controller";
import { UserDeleteController } from "./controllers/user/user-delete.controller";
import { UserEditController } from "./controllers/user/user-edit.controller";
import { UserGetController } from "./controllers/user/user-get.controller";
import { UserListController } from "./controllers/user/user-list.controller";

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    AccountRegisterController,
    UserCreateController,
    UserAuthenticateController,
    UserEditController,
    UserDeleteController,
    UserGetProfileController,
    ProfileEditController,
    ProfileDeleteController,
    UserGetController,
    UserListController,
  ],
  providers: [
    UserRegisterUseCase,
    UserAuthenticateUseCase,
    UserEditUseCase,
    UserDeleteUseCase,
    UserGetUseCase,
    UserListUseCase,
  ],
})
export class HttpModule {}
