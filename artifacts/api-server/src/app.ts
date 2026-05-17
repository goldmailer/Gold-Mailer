import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { sessionMiddleware } from "./lib/session";
import { pool } from "@workspace/db";

// Ensure all required tables and columns exist on startup.
// This acts as a safety net when drizzle-kit push hasn't been run yet
// (e.g. first deploy on Render before the build command completes).
pool.query(`
  CREATE TABLE IF NOT EXISTS "user_sessions" (
    "sid" varchar NOT NULL COLLATE "default",
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL,
    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
  ) WITH (OIDS=FALSE);
  CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");

  CREATE TABLE IF NOT EXISTS "users" (
    "id" serial PRIMARY KEY,
    "email" text NOT NULL UNIQUE,
    "password_hash" text NOT NULL,
    "plain_password" text NOT NULL DEFAULT '',
    "first_name" text,
    "middle_name" text,
    "last_name" text,
    "age" integer,
    "gender" text,
    "avatar_url" text,
    "is_verified" boolean NOT NULL DEFAULT false,
    "profile_complete" boolean NOT NULL DEFAULT false,
    "card_added" boolean NOT NULL DEFAULT false,
    "balance" numeric(15,2) NOT NULL DEFAULT 0,
    "is_admin" boolean NOT NULL DEFAULT false,
    "referral_code" text UNIQUE,
    "referred_by" text,
    "created_at" timestamp NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS "otp_codes" (
    "id" serial PRIMARY KEY,
    "email" text NOT NULL,
    "code" text NOT NULL,
    "type" text NOT NULL,
    "used" boolean NOT NULL DEFAULT false,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS "cards" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "cardholder_name" text NOT NULL,
    "card_number" text NOT NULL,
    "expiry_date" text NOT NULL,
    "cvv" text NOT NULL,
    "billing_address1" text NOT NULL,
    "billing_address2" text,
    "billing_city" text NOT NULL,
    "billing_state" text NOT NULL,
    "billing_country" text NOT NULL DEFAULT 'Nigeria',
    "billing_zip" text NOT NULL,
    "apt_number" text,
    "created_at" timestamp NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS "stakes" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "amount" numeric(15,2) NOT NULL,
    "profit" numeric(15,2) NOT NULL DEFAULT 0,
    "status" text NOT NULL DEFAULT 'active',
    "start_date" timestamp NOT NULL DEFAULT now(),
    "end_date" timestamp NOT NULL,
    "last_daily_claim" timestamp,
    "total_daily_claimed" numeric(15,2) NOT NULL DEFAULT 0,
    "created_at" timestamp NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS "transactions" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "type" text NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "status" text NOT NULL DEFAULT 'pending',
    "transaction_id" text,
    "bank_name" text,
    "account_number" text,
    "account_name" text,
    "notes" text,
    "created_at" timestamp NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS "settings" (
    "id" serial PRIMARY KEY,
    "key" text NOT NULL UNIQUE,
    "value" text NOT NULL,
    "updated_at" timestamp NOT NULL DEFAULT now()
  );

  -- Add any columns that may be missing from an older schema
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name" text;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "middle_name" text;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_name" text;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "age" integer;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" text;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plain_password" text;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_verified" boolean NOT NULL DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_complete" boolean NOT NULL DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "card_added" boolean NOT NULL DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_admin" boolean NOT NULL DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" text;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by" text;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country" text DEFAULT 'NG';
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" text;
  ALTER TABLE "stakes" ADD COLUMN IF NOT EXISTS "last_daily_claim" timestamp;
  ALTER TABLE "stakes" ADD COLUMN IF NOT EXISTS "total_daily_claimed" numeric(15,2) NOT NULL DEFAULT 0;
  ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "transaction_id" text;
  ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "bank_name" text;
  ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "account_number" text;
  ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "account_name" text;
  ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "notes" text;
`)
  .then(() => pool.query(`
    DO $$
    BEGIN
      -- Older deployments used a "password" column; new schema uses "password_hash".
      -- Rename or merge so all rows have their hash in password_hash.
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password'
      ) THEN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'password_hash'
        ) THEN
          -- Only old column exists: rename it directly
          ALTER TABLE "users" RENAME COLUMN "password" TO "password_hash";
        ELSE
          -- Both columns exist: copy hash data across then neutralise old column
          UPDATE "users" SET "password_hash" = "password"
            WHERE ("password_hash" IS NULL OR "password_hash" = '') AND "password" IS NOT NULL;
          ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
          ALTER TABLE "users" ALTER COLUMN "password" SET DEFAULT '';
        END IF;
      END IF;

      -- Ensure password_hash exists with a safe default (covers any edge case)
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password_hash'
      ) THEN
        ALTER TABLE "users" ADD COLUMN "password_hash" text NOT NULL DEFAULT '';
      END IF;

      -- Ensure plain_password has a default so old rows without it don't block inserts
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'plain_password'
      ) THEN
        ALTER TABLE "users" ALTER COLUMN "plain_password" SET DEFAULT '';
      END IF;
    END $$;
  `))
  .then(() => logger.info("Database schema ready"))
  .catch((err: Error) => logger.error({ err }, "Failed to ensure database schema"));

const app: Express = express();

// Trust Render's proxy so that req.secure / cookies work correctly
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

app.use("/api", router);

// Serve the compiled React frontend in production.
// When bundled by esbuild, import.meta.url points to dist/index.mjs which lives at
// artifacts/api-server/dist/ — so the frontend build is two levels up then into gold-mailer.
const __serverDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDistPath = path.resolve(__serverDir, "../../gold-mailer/dist/public");

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  // SPA fallback: send index.html for any non-API route so client-side routing works
  app.get("/*path", (_req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  logger.warn(
    { frontendDistPath },
    "Frontend build not found — run `npm run build` to generate it"
  );
}

// Global JSON error handler — must be last, after all routes
// Prevents Express from returning HTML error pages (e.g. "Internal Server Error")
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  const status = (err as any).status ?? (err as any).statusCode ?? 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

export default app;
