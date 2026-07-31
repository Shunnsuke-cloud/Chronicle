import { HTTPException } from "hono/http-exception";

export type JsonObject = Record<string, unknown>;

export async function readJsonObject(request: { json: () => Promise<unknown> }) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new HTTPException(400, {
      message: "Request body must be valid JSON.",
    });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HTTPException(400, {
      message: "Request body must be a JSON object.",
    });
  }

  return body as JsonObject;
}

export function readRequiredParam(value: string | undefined, name: string) {
  if (!value) {
    throw new HTTPException(400, {
      message: `${name} is required.`,
    });
  }

  return value;
}

export function readOptionalInteger(value: string | undefined, name: string) {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new HTTPException(400, {
      message: `${name} must be an integer.`,
    });
  }

  return parsed;
}

export function readRequiredInteger(value: string | undefined, name: string) {
  const parsed = readOptionalInteger(value, name);

  if (parsed === undefined) {
    throw new HTTPException(400, {
      message: `${name} is required.`,
    });
  }

  return parsed;
}

export function readOptionalDate(value: string | undefined, name: string) {
  if (value === undefined) {
    return undefined;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new HTTPException(400, {
      message: `${name} must be a valid date.`,
    });
  }

  return parsed;
}
