import { handle } from "hono/vercel";
import { httpApp } from "@/server/http/app";

export const GET = handle(httpApp);
export const POST = handle(httpApp);
export const PUT = handle(httpApp);
export const PATCH = handle(httpApp);
export const DELETE = handle(httpApp);
