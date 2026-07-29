import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// GET /settings/card-required
router.get("/settings/card-required", async (_req, res) => {
  const row = await db.select().from(settingsTable).where(eq(settingsTable.key, "card_required")).limit(1);
  const required = row.length === 0 ? true : row[0].value !== "false";
  res.json({ required });
});

// GET /settings/crypto-wallets
router.get("/settings/crypto-wallets", async (_req, res) => {
  const row = await db.select().from(settingsTable).where(eq(settingsTable.key, "crypto_wallets")).limit(1);
  const wallets = row.length === 0 ? [] : JSON.parse(row[0].value);
  res.json({ wallets });
});

export default router;
