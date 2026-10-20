import { UseCaseError } from "@/core/errors/use-case-error";

export class InvalidUserRole extends Error implements UseCaseError {
  constructor(role: string) {
    super(`User role ${role} is invalid.`);
  }
}
