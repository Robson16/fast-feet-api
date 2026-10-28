import { Module } from "@nestjs/common";

import { PacketListByRecipientUseCase } from "@/domain/order/application/use-cases/packet-list-by-recipient.usecase";
import { UserAuthenticateUseCase } from "@/domain/user/application/use-cases/user-authenticate.usecase";
import { UserChangePasswordUseCase } from "@/domain/user/application/use-cases/user-change-password.usecase.ts";
import { UserDeleteUseCase } from "@/domain/user/application/use-cases/user-delete.usecase";
import { UserEditUseCase } from "@/domain/user/application/use-cases/user-edit.usecase";
import { UserGetUseCase } from "@/domain/user/application/use-cases/user-get.usecase";
import { UserListUseCase } from "@/domain/user/application/use-cases/user-list.usecase";
import { UserRegisterUseCase } from "@/domain/user/application/use-cases/user-register.usecase";
import { UserResetPasswordUseCase } from "@/domain/user/application/use-cases/user-reset-password.usecase";
import { CryptographyModule } from "@/infra/cryptography/cryptography.module";
import { DatabaseModule } from "@/infra/database/database.module";

import { AccountRegisterController } from "./controllers/account/account-register.controller";
import { UserAuthenticateController } from "./controllers/auth/authenticate.controller";
import { PacketListByRecipientController } from "./controllers/packet/packet-list-by-recipient.controller";
import { ProfileChangePasswordController } from "./controllers/profile/profile-change-password.controller";
import { ProfileDeleteController } from "./controllers/profile/profile-delete.controller";
import { ProfileEditController } from "./controllers/profile/profile-edit.controller";
import { UserGetProfileController } from "./controllers/profile/profile-get.controller";
import { UserCreateController } from "./controllers/user/user-create.controller";
import { UserDeleteController } from "./controllers/user/user-delete.controller";
import { UserEditController } from "./controllers/user/user-edit.controller";
import { UserGetController } from "./controllers/user/user-get.controller";
import { UserListController } from "./controllers/user/user-list.controller";
import { UserResetPasswordController } from "./controllers/user/user-reset-password.controller";

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    AccountRegisterController,
    UserCreateController,
    UserAuthenticateController,
    UserGetProfileController,
    UserGetController,
    UserListController,
    ProfileEditController,
    UserEditController,
    ProfileChangePasswordController,
    UserResetPasswordController,
    ProfileDeleteController,
    UserDeleteController,
    PacketListByRecipientController,
  ],
  providers: [
    UserRegisterUseCase,
    UserAuthenticateUseCase,
    UserGetUseCase,
    UserListUseCase,
    UserEditUseCase,
    UserChangePasswordUseCase,
    UserResetPasswordUseCase,
    UserDeleteUseCase,
    PacketListByRecipientUseCase,
  ],
})
export class HttpModule {}
