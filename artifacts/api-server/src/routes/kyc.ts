import { Router } from "express";
import { db, usersTable, kycSubmissionsTable } from "@workspace/db";
import { eq, sql, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth-middleware";

const router = Router();

// GET /kyc/status — get current user's KYC status
router.get("/kyc/status", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const users = await db.select({ kycStatus: usersTable.kycStatus })
    .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (users.length === 0) { res.status(404).json({ error: "User not found" }); return; }

  const subs = await db.select().from(kycSubmissionsTable)
    .where(eq(kycSubmissionsTable.userId, userId))
    .orderBy(sql`${kycSubmissionsTable.createdAt} DESC`)
    .limit(1);

  res.json({
    kycStatus: users[0].kycStatus,
    latestSubmission: subs.length > 0 ? {
      id: subs[0].id,
      idType: subs[0].idType,
      status: subs[0].status,
      notes: subs[0].notes,
      createdAt: subs[0].createdAt,
    } : null,
  });
});

// POST /kyc/submit — user submits KYC document
router.post("/kyc/submit", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { idType, idImageUrl } = req.body;

  if (!idType || !idImageUrl) {
    res.status(400).json({ error: "ID type and image are required" });
    return;
  }
  if (!["nin", "voters_card", "passport"].includes(idType)) {
    res.status(400).json({ error: "Invalid ID type" });
    return;
  }

  const users = await db.select({ country: usersTable.country, kycStatus: usersTable.kycStatus })
    .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (users.length === 0) { res.status(404).json({ error: "User not found" }); return; }
  if (users[0].country !== "NG") {
    res.status(403).json({ error: "KYC is only required for Nigerian accounts" }); return;
  }
  if (users[0].kycStatus === "approved") {
    res.status(400).json({ error: "Your KYC is already approved" }); return;
  }

  await db.insert(kycSubmissionsTable).values({ userId, idType, idImageUrl, status: "pending" });
  await db.update(usersTable).set({ kycStatus: "pending" }).where(eq(usersTable.id, userId));

  res.json({ message: "KYC submitted successfully. We will review and get back to you." });
});

// GET /admin/kyc — admin views all KYC submissions
router.get("/admin/kyc", requireAdmin, async (req, res) => {
  const subs = await db.select().from(kycSubmissionsTable)
    .orderBy(sql`${kycSubmissionsTable.createdAt} DESC`);

  const userIds = [...new Set(subs.map(s => s.userId))];
  let usersMap: Record<number, any> = {};
  if (userIds.length > 0) {
    const usersData = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      kycStatus: usersTable.kycStatus,
    }).from(usersTable).where(inArray(usersTable.id, userIds));
    for (const u of usersData) usersMap[u.id] = u;
  }

  res.json(subs.map(s => ({
    id: s.id,
    userId: s.userId,
    idType: s.idType,
    idImageUrl: s.idImageUrl,
    status: s.status,
    notes: s.notes,
    createdAt: s.createdAt,
    user: usersMap[s.userId] ?? null,
  })));
});

// POST /admin/kyc/:id/approve
router.post("/admin/kyc/:id/approve", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const subs = await db.select().from(kycSubmissionsTable)
    .where(eq(kycSubmissionsTable.id, id)).limit(1);
  if (subs.length === 0) { res.status(404).json({ error: "Submission not found" }); return; }

  await db.update(kycSubmissionsTable).set({ status: "approved" }).where(eq(kycSubmissionsTable.id, id));
  await db.update(usersTable)
    .set({ kycStatus: "approved", balance: sql`${usersTable.balance} + 20` })
    .where(eq(usersTable.id, subs[0].userId));

  res.json({ message: "KYC approved. $20 bonus credited to user." });
});

// POST /admin/kyc/:id/decline
router.post("/admin/kyc/:id/decline", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { notes } = req.body;

  const subs = await db.select().from(kycSubmissionsTable)
    .where(eq(kycSubmissionsTable.id, id)).limit(1);
  if (subs.length === 0) { res.status(404).json({ error: "Submission not found" }); return; }

  await db.update(kycSubmissionsTable).set({ status: "declined", notes: notes || null })
    .where(eq(kycSubmissionsTable.id, id));
  await db.update(usersTable).set({ kycStatus: "declined" }).where(eq(usersTable.id, subs[0].userId));

  res.json({ message: "KYC declined." });
});

export default router;
