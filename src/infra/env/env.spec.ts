import { envSchema } from "./env";

const requiredEnvironment = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/fast-feet",
  JWT_PRIVATE_KEY: "private-key",
  JWT_PUBLIC_KEY: "public-key",
  APP_ADMIN_PASSWORD: "",
};

describe("environment schema", () => {
  it("defaults the JWT access token TTL to 15 minutes", () => {
    const env = envSchema.parse(requiredEnvironment);

    expect(env.JWT_ACCESS_TOKEN_TTL_SECONDS).toBe(900);
  });

  it("accepts a configured JWT access token TTL in seconds", () => {
    const env = envSchema.parse({
      ...requiredEnvironment,
      JWT_ACCESS_TOKEN_TTL_SECONDS: "1800",
    });

    expect(env.JWT_ACCESS_TOKEN_TTL_SECONDS).toBe(1800);
  });

  it.each(["59", "86401", "900.5", "not-a-number"])(
    "rejects an invalid JWT access token TTL: %s",
    (ttl) => {
      expect(() =>
        envSchema.parse({
          ...requiredEnvironment,
          JWT_ACCESS_TOKEN_TTL_SECONDS: ttl,
        }),
      ).toThrow();
    },
  );
});
