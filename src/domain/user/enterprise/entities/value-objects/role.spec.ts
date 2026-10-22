import { Role } from "./role";

describe("Role", () => {
  it.each(["ADMIN", "DELIVERER", "RECIPIENT"])(
    "should be able to create the %s role",
    (value) => {
      const role = Role.create(value);

      expect(role.value).toEqual(value);
      expect(Role.validate(value)).toBe(true);
    },
  );

  it.each(["", "USER", "admin", "recipient"])(
    "should reject the invalid role %s",
    (value) => {
      expect(Role.validate(value)).toBe(false);
      expect(() => Role.create(value)).toThrow("Invalid Role");
    },
  );
});
