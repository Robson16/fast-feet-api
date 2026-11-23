export type RoleType = "ADMIN" | "DELIVERER" | "RECIPIENT";

export class Role {
  public readonly value: RoleType;

  constructor(value: RoleType) {
    this.value = value;
  }

  static create(role: RoleType): Role;
  static create(role: string): Role;
  static create(role: string): Role {
    if (Role.validate(role)) {
      return new Role(role as RoleType);
    } else {
      throw new Error("Invalid Role");
    }
  }

  static validate(role: string): boolean {
    return role === "ADMIN" || role === "DELIVERER" || role === "RECIPIENT";
  }
}
