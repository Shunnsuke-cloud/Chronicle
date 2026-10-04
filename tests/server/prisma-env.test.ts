import { describe, expect, it } from "vitest";
import { parsePrismaEnv } from "@/lib/prisma-env";

const url = "postgresql://user:private-password@ep-example.neon.tech/db";
describe("Prisma CLI configuration", () => {
  it("accepts PostgreSQL CLI URLs without applying runtime SSL policy", () => {
    expect(parsePrismaEnv({ DATABASE_URL: url }).url).toBe(url);
  });
  it("ignores blank optional settings", () => {
    expect(parsePrismaEnv({ DATABASE_URL: url, DIRECT_URL: " ", SHADOW_DATABASE_URL: " " })).toEqual({ url });
  });
  it("uses the explicit direct URL", () => {
    expect(parsePrismaEnv({ DATABASE_URL: url, DIRECT_URL: "postgres://user:pass@localhost/direct" }).url).toContain("/direct");
  });
  it.each(["DATABASE_URL", "DIRECT_URL", "SHADOW_DATABASE_URL"])("identifies invalid %s without disclosing it", (key) => {
    expect(() => parsePrismaEnv({ DATABASE_URL: url, [key]: "private-password" })).toThrow(`Invalid ${key}:`);
    try { parsePrismaEnv({ DATABASE_URL: url, [key]: "private-password" }); }
    catch (error) { expect(String(error)).not.toContain("private-password"); }
  });
});
