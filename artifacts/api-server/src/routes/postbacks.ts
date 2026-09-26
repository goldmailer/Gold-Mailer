import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { pool } from "@workspace/db";
import { requireAuth } from "../lib/auth-middleware";

const router = Router();

// Credentials & Configuration
const CPX_APP_ID = process.env.CPX_APP_ID || "36554";
const CPX_SECRET = process.env.CPX_SECRET || "7pSyJPPfNZYNV2zLirffBdjnTt39SY67";
const CPX_COIN_RATE = 700; // 700 Coins = $1 USD (User gets 70%)
const CPX_BONUS_RATE = 70; // 70 Coins = $1 USD screenout bonus

const BITLABS_API_TOKEN = process.env.BITLABS_API_TOKEN || "8f1daa8f-fdbc-41e7-9010-45973b88e45";
const BITLABS_SECRET_KEY = process.env.BITLABS_SECRET_KEY || "PASTE_YOUR_SECRET_FROM_EYE_ICON_HERE";
const BITLABS_S2S_KEY = process.env.BITLABS_S2S_KEY || "PASTE_YOUR_S2S_KEY_HERE";
const BITLABS_COIN_RATE = 700; // 700 Coins = $1 USD

function md5(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

function verifyBitlabsSignature(req: Request, secretKey: string): boolean {
  const providedSig = String(
    req.headers["x-bitlabs-signature"] ||
    req.query.hash ||
    req.query.signature ||
    (req.body && (req.body.hash || req.body.signature)) ||
    ""
  ).trim();

  if (!providedSig) return false;

  const keysToTry = [secretKey, BITLABS_S2S_KEY].filter(Boolean);
  const userId = String(req.query.user_id ?? req.query.uid ?? req.body?.user_id ?? req.body?.uid ?? "");
  const transId = String(req.query.transaction_id ?? req.query.transactionId ?? req.query.trans_id ?? req.body?.transaction_id ?? req.body?.transactionId ?? "");
  const reward = String(req.query.reward ?? req.query.amount_usd ?? req.query.val ?? req.body?.reward ?? req.body?.amount_usd ?? "");

  // Reconstruct URL without &hash=... or &signature=... for standard BitLabs URL HMAC-SHA256
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.get("host") || "tasknest.name.ng";
  const cleanOriginalUrl = req.originalUrl
    .replace(/([?&])(hash|signature)=[^&]*/gi, "")
    .replace(/[?&]$/, "");
  const fullUrl = `${protocol}://${host}${cleanOriginalUrl}`;
  const prodUrl = `https://tasknest.name.ng${cleanOriginalUrl}`;

  // Also sort query params (excluding hash/signature) for parameter-based HMAC-SHA256
  const queryClone: Record<string, any> = { ...(req.query as Record<string, any>), ...(typeof req.body === "object" ? req.body : {}) };
  delete queryClone.hash;
  delete queryClone.signature;
  const sortedQuery = Object.keys(queryClone)
    .sort()
    .map((k) => `${k}=${queryClone[k]}`)
    .join("&");

  const payloadsToTest = [
    fullUrl,
    prodUrl,
    sortedQuery,
    JSON.stringify(req.body || {}),
    `${userId}:${transId}:${reward}`,
    `${userId}-${transId}-${reward}`,
    `${transId}:${userId}:${reward}`,
  ];

  for (const key of keysToTry) {
    for (const payload of payloadsToTest) {
      const expectedHex = crypto.createHmac("sha256", key).update(payload).digest("hex");
      if (
        expectedHex.length === providedSig.length &&
        crypto.timingSafeEqual(Buffer.from(expectedHex.toLowerCase()), Buffer.from(providedSig.toLowerCase()))
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 1. CPX RESEARCH POSTBACK HANDLER
 * Route: GET / POST https://tasknest.name.ng/api/postback/cpx
 * Query params: status, user_id, amount_usd, hash (or secure_hash), trans_id
 */
async function handleCpxPostback(req: Request, res: Response) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");

  try {
    const status = String(req.query.status ?? req.body?.status ?? "").trim();
    const userIdRaw = String(req.query.user_id ?? req.query.ext_user_id ?? req.body?.user_id ?? "").trim();
    const amountUsdRaw = String(req.query.amount_usd ?? req.body?.amount_usd ?? "0").trim();
    const hash = String(req.query.hash ?? req.query.secure_hash ?? req.body?.hash ?? req.body?.secure_hash ?? "").trim();
    const transId = String(req.query.trans_id ?? req.body?.trans_id ?? "").trim();

    if (!userIdRaw || !transId) {
      res.status(400).send("missing parameters");
      return;
    }

    // Security check: Verify hash must equal md5(user_id + "-" + "7pSyJPPfNZYNV2zLirffBdjnTt39SY67")
    const expectedHash = md5(`${userIdRaw}-${CPX_SECRET}`);
    if (!hash || hash.toLowerCase() !== expectedHash.toLowerCase()) {
      res.status(200).send("hash invalid");
      return;
    }

    const userId = parseInt(userIdRaw, 10);
    const amountUsd = parseFloat(amountUsdRaw) || 0;

    // Ensure cpx_transactions table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "cpx_transactions" (
        "id" serial PRIMARY KEY,
        "trans_id" text NOT NULL UNIQUE,
        "user_id" integer NOT NULL,
        "amount_usd" numeric(15,4) NOT NULL DEFAULT 0,
        "coins" integer NOT NULL DEFAULT 0,
        "status" text NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now()
      );
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "coins" integer NOT NULL DEFAULT 0;
    `);

    // Prevent duplicate: Check if trans_id already exists
    const existing = await pool.query(
      `SELECT id FROM "cpx_transactions" WHERE "trans_id" = $1 LIMIT 1`,
      [transId]
    );

    if (existing.rows.length > 0) {
      res.status(200).send("OK - duplicate");
      return;
    }

    // Credit logic: Only credit if status = "complete" or status = 1 or status = "1"
    const isComplete =
      status.toLowerCase() === "complete" ||
      status === "1" ||
      Number(status) === 1;
    const isScreenoutBonus =
      status.toLowerCase() === "screenout_bonus" ||
      status.toLowerCase() === "bonus";

    let coins = 0;
    if (isComplete) {
      coins = Math.round(amountUsd * CPX_COIN_RATE);
    } else if (isScreenoutBonus) {
      coins = Math.round(amountUsd * CPX_BONUS_RATE);
    }

    // Log transaction in cpx_transactions
    await pool.query(
      `INSERT INTO "cpx_transactions" ("trans_id", "user_id", "amount_usd", "coins", "status", "created_at")
       VALUES ($1, $2, $3, $4, $5, now())`,
      [transId, isNaN(userId) ? 0 : userId, amountUsd, coins, status]
    );

    // Credit user if complete (or bonus) and valid userId
    if ((isComplete || isScreenoutBonus) && coins > 0 && !isNaN(userId)) {
      const usdCredit = Number((coins / 1000).toFixed(2));
      await pool.query(
        `UPDATE "users"
         SET "coins" = COALESCE("coins", 0) + $1,
             "balance" = COALESCE("balance", 0) + $2
         WHERE "id" = $3`,
        [coins, usdCredit, userId]
      );

      await pool.query(
        `INSERT INTO "transactions" ("user_id", "type", "amount", "status", "transaction_id", "notes", "created_at")
         VALUES ($1, $2, $3, $4, $5, $6, now())`,
        [userId, "cpx_survey", usdCredit, "approved", transId, `CPX Research Survey (${coins} Coins)`]
      ).catch(() => {});

      await pool.query(
        `INSERT INTO "user_inbox" ("user_id", "title", "message", "type", "created_at")
         VALUES ($1, $2, $3, $4, now())`,
        [
          userId,
          "Survey Completed! Coins Credited",
          `You earned ${coins} Coins ($${usdCredit.toFixed(2)}) from CPX Research survey #${transId}.`,
          "reward"
        ]
      ).catch(() => {});
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("CPX Postback Error:", err);
    res.status(200).send("OK");
  }
}

router.get("/postback/cpx", handleCpxPostback);
router.post("/postback/cpx", handleCpxPostback);

/**
 * 2. BITLABS POSTBACK HANDLER
 * Route: GET / POST https://tasknest.name.ng/api/postback/bitlabs
 */
async function handleBitlabsPostback(req: Request, res: Response) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");

  try {
    // 1. Verify HMAC SHA256 signature with Secret Key
    if (!verifyBitlabsSignature(req, BITLABS_SECRET_KEY)) {
      res.status(401).send("Invalid signature");
      return;
    }

    const userIdRaw = String(
      req.query.user_id ?? req.query.uid ?? req.body?.user_id ?? req.body?.uid ?? ""
    ).trim();
    const transactionId = String(
      req.query.transaction_id ??
      req.query.transactionId ??
      req.query.trans_id ??
      req.query.tx_id ??
      req.body?.transaction_id ??
      req.body?.transactionId ??
      req.body?.trans_id ??
      ""
    ).trim();
    const rewardRaw = String(
      req.query.reward ?? req.query.amount_usd ?? req.query.val ?? req.body?.reward ?? req.body?.amount_usd ?? "0"
    ).trim();
    const type = String(
      req.query.type ?? req.body?.type ?? "complete"
    ).trim().toLowerCase();

    if (!userIdRaw || !transactionId) {
      res.status(400).send("Missing user_id or transactionId");
      return;
    }

    const userId = parseInt(userIdRaw, 10);
    const reward = parseFloat(rewardRaw) || 0;

    // Ensure bitlabs_transactions table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "bitlabs_transactions" (
        "id" serial PRIMARY KEY,
        "transaction_id" text NOT NULL UNIQUE,
        "user_id" integer NOT NULL,
        "reward" numeric(15,4) NOT NULL DEFAULT 0,
        "coins" integer NOT NULL DEFAULT 0,
        "type" text NOT NULL DEFAULT 'complete',
        "status" text NOT NULL DEFAULT 'approved',
        "created_at" timestamp NOT NULL DEFAULT now()
      );
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "coins" integer NOT NULL DEFAULT 0;
    `);

    // 2. Check duplicate transactionId in bitlabs_transactions unique
    const existing = await pool.query(
      `SELECT id FROM "bitlabs_transactions" WHERE "transaction_id" = $1 LIMIT 1`,
      [transactionId]
    );

    if (existing.rows.length > 0) {
      res.status(200).send("OK - duplicate");
      return;
    }

    // 3. Calculate coins = reward * 700
    // If type=reconciliation and reward negative, deduct
    let coins = Math.round(reward * BITLABS_COIN_RATE);
    if (type === "reconciliation" && reward < 0) {
      coins = -Math.abs(Math.round(Math.abs(reward) * BITLABS_COIN_RATE));
    }

    const statusLabel = type === "reconciliation" && coins < 0 ? "reconciled" : "approved";

    await pool.query(
      `INSERT INTO "bitlabs_transactions" ("transaction_id", "user_id", "reward", "coins", "type", "status", "created_at")
       VALUES ($1, $2, $3, $4, $5, $6, now())`,
      [transactionId, isNaN(userId) ? 0 : userId, reward, coins, type, statusLabel]
    );

    if (!isNaN(userId) && coins !== 0) {
      const usdDelta = Number((coins / 1000).toFixed(2));
      await pool.query(
        `UPDATE "users"
         SET "coins" = GREATEST(0, COALESCE("coins", 0) + $1),
             "balance" = GREATEST(0, COALESCE("balance", 0) + $2)
         WHERE "id" = $3`,
        [coins, usdDelta, userId]
      );

      await pool.query(
        `INSERT INTO "transactions" ("user_id", "type", "amount", "status", "transaction_id", "notes", "created_at")
         VALUES ($1, $2, $3, $4, $5, $6, now())`,
        [
          userId,
          coins < 0 ? "bitlabs_reconciliation" : "bitlabs_offer",
          Math.abs(usdDelta),
          statusLabel,
          transactionId,
          `BitLabs (${coins >= 0 ? "+" : ""}${coins} Coins)`,
        ]
      ).catch(() => {});
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("BitLabs Postback Error:", err);
    res.status(200).send("OK");
  }
}

router.get("/postback/bitlabs", handleBitlabsPostback);
router.post("/postback/bitlabs", handleBitlabsPostback);

/**
 * 3. OFFERWALL CONFIGURATION & USER HASH ENDPOINT
 * Route: GET /api/offerwalls/config
 */
router.get("/offerwalls/config", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const secureHash = md5(`${userId}-${CPX_SECRET}`);
    const cpxIframeUrl = `https://offers.cpx-research.com/index.php?app_id=${CPX_APP_ID}&ext_user_id=${userId}&secure_hash=${secureHash}&subId_1=&subId_2=`;
    const bitlabsIframeUrl = `https://web.bitlabs.ai?token=${BITLABS_API_TOKEN}&uid=${userId}`;

    const userRes = await pool.query(
      `SELECT id, email, first_name, balance, COALESCE(coins, 0) AS coins FROM "users" WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const userRow = userRes.rows[0] || { id: userId, balance: 0, coins: 0 };

    const cpxHistory = await pool.query(
      `SELECT id, trans_id, amount_usd, coins, status, created_at
       FROM "cpx_transactions"
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    ).catch(() => ({ rows: [] }));

    const bitlabsHistory = await pool.query(
      `SELECT id, transaction_id, reward, coins, type, status, created_at
       FROM "bitlabs_transactions"
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    ).catch(() => ({ rows: [] }));

    res.json({
      userId,
      coins: Number(userRow.coins || 0),
      balance: Number(userRow.balance || 0),
      coinRate: CPX_COIN_RATE,
      bonusRate: CPX_BONUS_RATE,
      cpx: {
        appId: CPX_APP_ID,
        secureHash,
        iframeUrl: cpxIframeUrl,
        transactions: cpxHistory.rows,
      },
      bitlabs: {
        token: BITLABS_API_TOKEN,
        iframeUrl: bitlabsIframeUrl,
        transactions: bitlabsHistory.rows,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load offerwall config" });
  }
});

export default router;
