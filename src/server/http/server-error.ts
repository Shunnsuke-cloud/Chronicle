const databaseCodes = new Set(["P1000", "P1001", "P1002", "P1017", "P2024", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "28P01", "53300", "57P01"]);

export function isDatabaseUnavailable(error: unknown, depth = 0): boolean {
  if (!error || typeof error !== "object" || depth > 5) return false;
  const value = error as { code?: unknown; kind?: unknown; cause?: unknown; originalError?: unknown; meta?: { driverAdapterError?: unknown } };
  return (typeof value.code === "string" && databaseCodes.has(value.code)) ||
    ["DatabaseNotReachable", "ConnectionClosed", "SocketTimeout"].includes(String(value.kind)) ||
    isDatabaseUnavailable(value.cause, depth + 1) ||
    isDatabaseUnavailable(value.originalError, depth + 1) ||
    isDatabaseUnavailable(value.meta?.driverAdapterError, depth + 1);
}

export function logServerError(operation: string, error: unknown) {
  // Never serialize messages, stacks, SQL, requests, or adapter metadata.
  console.error(JSON.stringify({ event: "server_error", operation,
    category: isDatabaseUnavailable(error) ? "database_unavailable" : "internal_error" }));
}

export function authUnavailableResponse() {
  return Response.json({ code: "AUTH_SERVICE_UNAVAILABLE", message: "認証サービスを一時的に利用できません。時間をおいて再度お試しください。" },
    { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" } });
}
