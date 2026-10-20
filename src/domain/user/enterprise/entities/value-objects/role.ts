export class Role {
  public readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  static create(role: string): Role {
    if (Role.validate(role)) {
      return new Role(role);
    } else {
      throw new Error("Invalid Role");
    }
  }

  static validate(role: string): boolean {
    return role === "ADMIN" || role === "DELIVERER" || role === "RECIPIENT";
  }
}
