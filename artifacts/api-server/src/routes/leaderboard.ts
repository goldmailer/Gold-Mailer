import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "../lib/auth-middleware";

const router = Router();

const LEADERBOARD_QUERY = `
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
  WHERE u.profile_complete = true
  GROUP BY u.id, u.first_name, u.last_name, u.avatar_url, u.country, u.kyc_status, u.referral_code
  ORDER BY (total_staked + total_profit + total_daily) DESC
`;

function mapRow(r: any, i: number) {
  return {
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
  };
}

// GET /leaderboard — top earners by total staked + profit
router.get("/leaderboard", requireAuth, async (req, res) => {
  const requestingUserId = (req.session as any).userId;
  const result = await pool.query(LEADERBOARD_QUERY + " LIMIT 50");
  const rows = result.rows;
  const mapped = rows.map(mapRow);

  // Always include the requesting user's entry even if outside top 50
  const alreadyIncluded = rows.some((r: any) => r.id === requestingUserId);
  if (!alreadyIncluded) {
    try {
      const myResult = await pool.query(`
        SELECT
          u.id, u.first_name, u.last_name, u.avatar_url, u.country, u.kyc_status,
          COALESCE(SUM(CASE WHEN s.status IN ('active','completed') THEN s.amount ELSE 0 END), 0)::float AS total_staked,
          COALESCE(SUM(CASE WHEN s.status IN ('active','completed') THEN s.profit ELSE 0 END), 0)::float AS total_profit,
          COALESCE(SUM(CASE WHEN s.status IN ('active','completed') THEN s.total_daily_claimed ELSE 0 END), 0)::float AS total_daily,
          COUNT(CASE WHEN s.status IN ('active','completed') THEN 1 END)::int AS stake_count,
          (SELECT COUNT(*) FROM users u2 WHERE u2.referred_by = u.referral_code AND u2.kyc_status = 'approved')::int AS referral_count
        FROM users u
        LEFT JOIN stakes s ON s.user_id = u.id
        WHERE u.id = $1
        GROUP BY u.id, u.first_name, u.last_name, u.avatar_url, u.country, u.kyc_status, u.referral_code
      `, [requestingUserId]);
      if (myResult.rows.length > 0) {
        const myRow = myResult.rows[0];
        const myRank = mapped.length + 1;
        mapped.push({ ...mapRow(myRow, myRank - 1), rank: myRank });
      }
    } catch { /* ignore */ }
  }

  res.json(mapped);
});

export default router;
