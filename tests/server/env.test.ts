import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/lib/env";

const valid = {
  DATABASE_URL: "postgresql://user:private-password@localhost/db",
  BETTER_AUTH_SECRET: "random-test-secret-with-at-least-32-characters",
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("server environment", () => {
  it("requires explicit DB and auth settings in all environments", () => {
    for (const key of Object.keys(valid)) {
      expect(() => parseServerEnv({ ...valid, [key]: undefined })).toThrow(key);
    }
  });
  it("rejects production HTTP and placeholder secrets", () => {
    expect(() => parseServerEnv({ ...valid, NODE_ENV: "production" })).toThrow("BETTER_AUTH_URL");
    expect(() => parseServerEnv({ ...valid, BETTER_AUTH_SECRET: "development-secret-change-before-production" })).toThrow("BETTER_AUTH_SECRET");
  });
  it("requires SSL for Neon and redacts invalid values", () => {
    expect(() => parseServerEnv({ ...valid, DATABASE_URL: "postgresql://user:private-password@ep-test.neon.tech/db" })).toThrow("DATABASE_URL");
    try {
      parseServerEnv({ ...valid, DATABASE_URL: "private-password" });
    } catch (error) {
      expect(String(error)).not.toContain("private-password");
    }
  });
  it("accepts explicit production settings", () => {
    expect(parseServerEnv({ ...valid, NODE_ENV: "production", BETTER_AUTH_URL: "https://chronicle.example" }).NODE_ENV).toBe("production");
  });
});
