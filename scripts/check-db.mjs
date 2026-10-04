import { lookup } from "node:dns/promises";
import pg from "pg";

// Run inside Render with its runtime environment. Never print connection values.
const codes = new Set(["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENETUNREACH", "EHOSTUNREACH", "28P01", "3D000", "53300", "57P01", "CERT_HAS_EXPIRED", "DEPTH_ZERO_SELF_SIGNED_CERT", "SELF_SIGNED_CERT_IN_CHAIN", "UNABLE_TO_VERIFY_LEAF_SIGNATURE"]);
let stage = "configuration";
let pool;
try {
  const value = process.env.DATABASE_URL?.trim();
  if (!value || !URL.canParse(value)) throw new Error();
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2) throw new Error();
  stage = "dns";
  // Lookup confirms resolution without exposing the hostname or IP addresses.
  await lookup(url.hostname);
  console.log(JSON.stringify({ event: "database_check", stage, ok: true }));
  stage = "connection_and_query";
  pool = new pg.Pool({ connectionString: value, max: 1, connectionTimeoutMillis: 10000, query_timeout: 10000 });
  pool.on("error", () => {});
  await pool.query("SELECT 1");
  console.log(JSON.stringify({ event: "database_check", stage, ok: true }));
} catch (error) {
  console.error(JSON.stringify({ event: "database_check", stage, ok: false,
    code: codes.has(error?.code) ? error.code : "UNCLASSIFIED" }));
  process.exitCode = 1;
} finally {
  await pool?.end();
}
