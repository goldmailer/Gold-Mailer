import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware";

const router = Router();

// GET /referral/stats — get user's referral code and stats
router.get("/referral/stats", requireAuth, async (req, res) => {
  const userId = req.session.userId!;

  const users = await db.select({
    referralCode: usersTable.referralCode,
    country: usersTable.country,
  }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (users.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { referralCode, country } = users[0];

  if (!referralCode) {
    res.json({ referralCode: null, totalReferrals: 0, approvedReferrals: 0, bonusPerReferral: 0 });
    return;
  }

  const totalResult = await db.select({ total: count() })
    .from(usersTable)
    .where(eq(usersTable.referredBy, referralCode));

  const approvedResult = await db.select({ total: count() })
    .from(usersTable)
    .where(and(eq(usersTable.referredBy, referralCode), eq(usersTable.kycStatus, "approved")));

  const isNG = (country ?? "NG") === "NG";
  const bonusPerReferral = isNG ? 500 : 0.5;
  const bonusSymbol = isNG ? "₦" : "$";

  res.json({
    referralCode,
    totalReferrals: Number(totalResult[0]?.total ?? 0),
    approvedReferrals: Number(approvedResult[0]?.total ?? 0),
    bonusPerReferral,
    bonusSymbol,
  });
});

export default router;
