import { describe, expect, it } from "vitest";
import { HTTPException } from "hono/http-exception";
import {
  readJsonObject,
  readOptionalDate,
  readOptionalInteger,
  readRequiredInteger,
} from "@/server/http/request";

describe("HTTP request parsing", () => {
  it("accepts JSON objects", async () => {
    await expect(readJsonObject({ json: async () => ({ title: "Use Neon" }) })).resolves.toEqual({
      title: "Use Neon",
    });
  });

  it("rejects arrays and malformed JSON", async () => {
    await expect(readJsonObject({ json: async () => [] })).rejects.toBeInstanceOf(
      HTTPException,
    );
    await expect(
      readJsonObject({
        json: async () => Promise.reject(new SyntaxError("Invalid JSON")),
      }),
    ).rejects.toBeInstanceOf(HTTPException);
  });

  it("rejects invalid query values", () => {
    expect(() => readOptionalInteger("1.5", "version")).toThrow(HTTPException);
    expect(() => readRequiredInteger(undefined, "version")).toThrow(HTTPException);
    expect(() => readOptionalDate("not-a-date", "occurredAt")).toThrow(HTTPException);
  });
});
