import { Module } from "@nestjs/common";

import { StorageProvider } from "@/domain/order/application/storage/storage-provider";

import { EnvModule } from "../env/env.module";
import { R2Storage } from "./r2-storage";

@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: StorageProvider,
      useClass: R2Storage,
    },
  ],
  exports: [StorageProvider],
})
export class StorageModule {}
