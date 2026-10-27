import { Module } from "@nestjs/common";

import { DestinationsRepository } from "@/domain/order/application/repositories/destinations-repository";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { UsersRepository } from "@/domain/user/application/repositories/users-repository";

import { PrismaService } from "./prisma/prisma.service";
import { PrismaDestinationsRepository } from "./prisma/repositories/prisma-destinations-repository";
import { PrismaPacketsRepository } from "./prisma/repositories/prisma-packets-repository";
import { PrismaUsersRepository } from "./prisma/repositories/prisma-users-repository";

@Module({
  imports: [],
  providers: [
    PrismaService,
    {
      provide: UsersRepository,
      useClass: PrismaUsersRepository,
    },
    {
      provide: PacketsRepository,
      useClass: PrismaPacketsRepository,
    },
    {
      provide: DestinationsRepository,
      useClass: PrismaDestinationsRepository,
    },
  ],
  exports: [
    PrismaService,
    UsersRepository,
    PacketsRepository,
    DestinationsRepository,
  ],
})
export class DatabaseModule {}
