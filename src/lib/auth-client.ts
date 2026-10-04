"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Better Auth defaults to the current origin; no build-time public URL required.
});
