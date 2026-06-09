import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "../lib/auth-middleware";

const router = Router();

// GET /leaderboard — top earners by total staked + profit
router.get("/leaderboard", requireAuth, async (req, res) => {
  const result = await pool.query(`
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.avatar_url,
      u.country,
      u.kyc_status,
      COALESCE(SUM(CASE WHEN s.status IN ('active','completed') THEN s.amount ELSE 0 END), 0)::float AS total_staked,
      COALESCE(SUM(CASE WHEN s.status IN ('active','completed') THEN s.profit ELSE 0 END), 0)::float AS total_profit,
      COALESCE(SUM(CASE WHEN s.status IN ('active','completed') THEN s.total_daily_claimed ELSE 0 END), 0)::float AS total_daily,
      COUNT(CASE WHEN s.status IN ('active','completed') THEN 1 END)::int AS stake_count,
      (
        SELECT COUNT(*) FROM users u2
        WHERE u2.referred_by = u.referral_code
        AND u2.kyc_status = 'approved'
      )::int AS referral_count
    FROM users u
    LEFT JOIN stakes s ON s.user_id = u.id
    WHERE u.is_verified = true AND u.profile_complete = true
    GROUP BY u.id, u.first_name, u.last_name, u.avatar_url, u.country, u.kyc_status, u.referral_code
    ORDER BY (total_staked + total_profit) DESC
    LIMIT 20
  `);

  res.json(result.rows.map((r: any, i: number) => ({
    rank: i + 1,
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    avatarUrl: r.avatar_url,
    country: r.country ?? "NG",
    kycStatus: r.kyc_status,
    totalStaked: parseFloat(r.total_staked),
    totalProfit: parseFloat(r.total_profit),
    totalDailyRewards: parseFloat(r.total_daily),
    stakeCount: r.stake_count,
    referralCount: r.referral_count,
    totalEarnings: parseFloat(r.total_staked) + parseFloat(r.total_profit) + parseFloat(r.total_daily),
  })));
});

export default router;
