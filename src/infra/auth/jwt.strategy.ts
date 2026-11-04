import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { z } from "zod";

import { UsersRepository } from "@/domain/user/application/repositories/users-repository";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { EnvService } from "@/infra/env/env.service";

const tokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  exp: z.number().int().positive(),
  role: z
    .string()
    .refine(Role.validate, { message: "Invalid Role" })
    .default("DELIVERER"),
});

export type UserPayload = z.infer<typeof tokenPayloadSchema>;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: EnvService,
    private usersRepository: UsersRepository,
  ) {
    const publicKey = config.get("JWT_PUBLIC_KEY");

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: Buffer.from(publicKey, "base64"),
      algorithms: ["RS256"],
    });
  }

  async validate(payload: UserPayload) {
    const parsedPayload = tokenPayloadSchema.safeParse(payload);

    if (!parsedPayload.success) {
      throw new UnauthorizedException();
    }

    const { sub } = parsedPayload.data;

    const user = await this.usersRepository.findById(sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      sub: user.id.toString(),
      role: user.role.value,
    };
  }
}
