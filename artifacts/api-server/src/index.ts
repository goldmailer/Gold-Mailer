import app from "./app";
import { logger } from "./lib/logger";
import fs from "fs";
import path from "path";

// Load .env if present
try {
  if (typeof (process as any).loadEnvFile === "function") {
    const envPaths = [
      path.resolve(process.cwd(), ".env"),
      path.resolve(process.cwd(), "../../.env"),
      path.resolve(process.cwd(), "../.env"),
    ];
    for (const ep of envPaths) {
      if (fs.existsSync(ep)) {
        (process as any).loadEnvFile(ep);
        break;
      }
    }
  }
} catch (e) {}

const rawPort = process.env["PORT"];
const port = rawPort ? Number(rawPort) : 5000;
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const key = (process.env.RESEND_API_KEY || "").trim();
const hasKey = Boolean(key && key !== "replace-in-deployment-secrets");
console.log(`[BOOT] Server starting on port ${port}. RESEND_API_KEY present: ${hasKey ? "YES (starts with " + key.slice(0, 6) + "...)" : "NO"}`);

app.listen(port, "0.0.0.0", (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
