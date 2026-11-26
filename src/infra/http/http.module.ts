import { Module } from "@nestjs/common";

import { DestinationCreateUseCase } from "@/domain/order/application/use-cases/destination-create.usecase";
import { DestinationDeleteUseCase } from "@/domain/order/application/use-cases/destination-delete.usecase";
import { DestinationEditUseCase } from "@/domain/order/application/use-cases/destination-edit.usecase";
import { DestinationGetUseCase } from "@/domain/order/application/use-cases/destination-get.usecase";
import { DestinationListUseCase } from "@/domain/order/application/use-cases/destination-list.usecase";
import { PacketCreateUseCase } from "@/domain/order/application/use-cases/packet-create.usecase";
import { PacketDeleteUseCase } from "@/domain/order/application/use-cases/packet-delete.usecase";
import { PacketGetUseCase } from "@/domain/order/application/use-cases/packet-get.usecase";
import { PacketGetDeliveryPhotoUseCase } from "@/domain/order/application/use-cases/packet-get-delivery-photo.usecase";
import { PacketListByDelivererUseCase } from "@/domain/order/application/use-cases/packet-list-by-deliverer.usecase";
import { PacketListByRecipientUseCase } from "@/domain/order/application/use-cases/packet-list-by-recipient.usecase";
import { PacketUpdateStatusToAwaitingWithdrawalUseCase } from "@/domain/order/application/use-cases/packet-update-status-to-awaiting-withdrawal.usecase";
import { PacketUpdateStatusToDeliveredUseCase } from "@/domain/order/application/use-cases/packet-update-status-to-delivered.usecase";
import { PacketUpdateStatusToReturnedUseCase } from "@/domain/order/application/use-cases/packet-update-status-to-returned.usecase";
import { PacketUpdateStatusToWithdrawnUseCase } from "@/domain/order/application/use-cases/packet-update-status-to-withdrawn.usecase";
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
import { StorageModule } from "@/infra/storage/storage.module";

import { AccountRegisterController } from "./controllers/account/account-register.controller";
import { UserAuthenticateController } from "./controllers/auth/authenticate.controller";
import { DestinationCreateController } from "./controllers/destination/destination-create.controller";
import { DestinationDeleteController } from "./controllers/destination/destination-delete.controller";
import { DestinationEditController } from "./controllers/destination/destination-edit.controller";
import { DestinationGetController } from "./controllers/destination/destination-get.controller";
import { DestinationListController } from "./controllers/destination/destination-list.controller";
import { PacketAwaitingWithdrawalController } from "./controllers/packet/packet-awaiting-withdrawal.controller";
import { PacketCreateController } from "./controllers/packet/packet-create.controller";
import { PacketDeleteController } from "./controllers/packet/packet-delete.controller";
import { PacketDeliveredController } from "./controllers/packet/packet-delivered.controller";
import { PacketGetController } from "./controllers/packet/packet-get.controller";
import { PacketGetDeliveryPhotoController } from "./controllers/packet/packet-get-delivery-photo.controller";
import { PacketListByDelivererController } from "./controllers/packet/packet-list-by-deliverer.controller";
import { PacketListByRecipientController } from "./controllers/packet/packet-list-by-recipient.controller";
import { PacketReturnedController } from "./controllers/packet/packet-returned.controller";
import { PacketWithdrawnController } from "./controllers/packet/packet-withdrawn.controller";
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
  imports: [DatabaseModule, CryptographyModule, StorageModule],
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
    PacketCreateController,
    PacketGetController,
    PacketListByRecipientController,
    PacketListByDelivererController,
    PacketDeleteController,
    PacketWithdrawnController,
    PacketReturnedController,
    PacketAwaitingWithdrawalController,
    PacketDeliveredController,
    PacketGetDeliveryPhotoController,
    DestinationCreateController,
    DestinationGetController,
    DestinationDeleteController,
    DestinationEditController,
    DestinationListController,
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
    PacketCreateUseCase,
    PacketGetUseCase,
    PacketListByRecipientUseCase,
    PacketListByDelivererUseCase,
    PacketDeleteUseCase,
    PacketUpdateStatusToWithdrawnUseCase,
    PacketUpdateStatusToReturnedUseCase,
    PacketUpdateStatusToAwaitingWithdrawalUseCase,
    PacketUpdateStatusToDeliveredUseCase,
    PacketGetDeliveryPhotoUseCase,
    DestinationCreateUseCase,
    DestinationGetUseCase,
    DestinationDeleteUseCase,
    DestinationEditUseCase,
    DestinationListUseCase,
  ],
})
export class HttpModule {}
