import { Router } from "express";
import { and, count, eq, sum } from "drizzle-orm";
import { db, transactionsTable, usersTable } from "@workspace/db";

const router = Router();

// GET /public/stats — public homepage metrics based on approved records.
router.get("/public/stats", async (_req, res) => {
  const [userResult, payoutResult] = await Promise.all([
    db
      .select({ total: count() })
      .from(usersTable)
      .where(eq(usersTable.isAdmin, false)),
    db
      .select({ total: count(), amount: sum(transactionsTable.amount) })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.type, "withdrawal"),
          eq(transactionsTable.status, "approved"),
        ),
      ),
  ]);

  res.json({
    users: Number(userResult[0]?.total ?? 0),
    payouts: Number(payoutResult[0]?.total ?? 0),
    payoutAmount: Number(payoutResult[0]?.amount ?? 0),
  });
});

export default router;