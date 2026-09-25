import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const isLocalDb = process.env.DATABASE_URL?.includes("localhost") ||
  process.env.DATABASE_URL?.includes("127.0.0.1");

// Allow deployments to explicitly disable SSL (e.g. a local Docker Postgres
// reached via the compose service name rather than "localhost").
// When unset, the local/managed-DB heuristic below is used as before.
const sslDisabled = process.env.DATABASE_SSL === "false";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Replit's managed PostgreSQL uses a self-signed TLS certificate.
  // rejectUnauthorized is only disabled for non-local managed DB instances.
  ssl: sslDisabled || isLocalDb ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

export * from "./schema";
