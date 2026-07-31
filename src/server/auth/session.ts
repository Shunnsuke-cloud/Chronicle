import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";

export async function getCurrentSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireCurrentUser() {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  return session.user;
}
