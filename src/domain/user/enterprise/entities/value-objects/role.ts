export type RoleValue = "ADMIN" | "DELIVERER" | "RECIPIENT";

export class Role {
  public readonly value: RoleValue;

  constructor(value: RoleValue) {
    this.value = value;
  }

  static create(role: RoleValue): Role;
  static create(role: string): Role;
  static create(role: string): Role {
    if (Role.validate(role)) {
      return new Role(role as RoleValue);
    } else {
      throw new Error("Invalid Role");
    }
  }

  static validate(role: string): boolean {
    return role === "ADMIN" || role === "DELIVERER" || role === "RECIPIENT";
  }
}
