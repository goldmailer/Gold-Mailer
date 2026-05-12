import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Added ssl configuration here to fix the connection issues
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true 
});

export const db = drizzle(pool, { schema });

export * from "./schema";
  
