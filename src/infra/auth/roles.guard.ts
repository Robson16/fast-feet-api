import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { ROLES_KEY } from "./roles-decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get the roles required by the route
    const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If the route does not require any role, allow access
    if (!requiredRoles) {
      return true;
    }

    // 2. Get the authenticated user from the request
    const { user } = context.switchToHttp().getRequest();

    // 3. Check whether the user has the required permission
    return requiredRoles.includes(user?.role);
  }
}
