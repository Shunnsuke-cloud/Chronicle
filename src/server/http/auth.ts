import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { auth } from "@/server/auth/auth";

export async function requireHttpUser(c: Context) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    throw new HTTPException(401, {
      message: "Authentication required.",
    });
  }

  return session.user;
}
