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

// Ensure user_sessions table exists (connect-pg-simple requires it)
pool.query(`
  CREATE TABLE IF NOT EXISTS "user_sessions" (
    "sid" varchar NOT NULL COLLATE "default",
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL,
    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
  ) WITH (OIDS=FALSE);
  CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");
`).then(() => logger.info("user_sessions table ready"))
  .catch((err: Error) => logger.error({ err }, "Failed to create user_sessions table"));

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
