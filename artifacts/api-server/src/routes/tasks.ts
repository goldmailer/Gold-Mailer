import { Router } from "express";
import { db, usersTable, taskSubmissionsTable } from "@workspace/db";
import { eq, sql, and, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth-middleware";

const router = Router();

export const TASK_WEBSITES = [
  { name: "SurveyMonkey", url: "https://www.surveymonkey.com", earn: 0.70, forNG: false },
  { name: "Google Forms", url: "https://forms.google.com", earn: 0.70, forNG: false },
  { name: "Typeform", url: "https://www.typeform.com", earn: 0.70, forNG: false },
  { name: "Qualtrics", url: "https://www.qualtrics.com", earn: 0.70, forNG: false },
  { name: "Jotform", url: "https://www.jotform.com", earn: 0.70, forNG: false },
  { name: "Microsoft Forms", url: "https://forms.microsoft.com", earn: 0.70, forNG: false },
  { name: "SurveySparrow", url: "https://surveysparrow.com", earn: 0.70, forNG: false },
  { name: "LimeSurvey", url: "https://www.limesurvey.org", earn: 0.70, forNG: false },
  { name: "Pollfish", url: "https://www.pollfish.com", earn: 0.70, forNG: false },
  { name: "Prolific", url: "https://www.prolific.com", earn: 0.70, forNG: false },
  { name: "Freecash", url: "https://freecash.com", earn: 0.70, forNG: false },
  { name: "Socialearning", url: "https://socialearning.com", earn: 0.70, forNG: true },
  { name: "SproutGigs", url: "https://sproutgigs.com", earn: 0.70, forNG: true },
  { name: "Microworkers", url: "https://microworkers.com", earn: 0.70, forNG: true },
  { name: "RapidWorkers", url: "https://rapidworkers.com", earn: 0.70, forNG: true },
  { name: "Clickworker", url: "https://www.clickworker.com", earn: 0.70, forNG: true },
  { name: "Amazon Mechanical Turk", url: "https://www.mturk.com", earn: 0.70, forNG: true },
  { name: "Hive Micro", url: "https://hivemicro.com", earn: 0.70, forNG: true },
  { name: "Appen", url: "https://appen.com", earn: 0.70, forNG: true },
  { name: "Toloka", url: "https://toloka.ai", earn: 0.70, forNG: true },
];

// GET /tasks — list available tasks for user
router.get("/tasks", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const users = await db.select({ country: usersTable.country })
    .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const isNG = !users.length || (users[0].country ?? "NG") === "NG";
  const tasks = isNG ? TASK_WEBSITES : TASK_WEBSITES.filter(t => !t.forNG);
  res.json(tasks);
});

// GET /tasks/my — user's task submission history
router.get("/tasks/my", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const subs = await db.select().from(taskSubmissionsTable)
    .where(eq(taskSubmissionsTable.userId, userId))
    .orderBy(sql`${taskSubmissionsTable.createdAt} DESC`);

  res.json(subs.map(s => ({
    id: s.id,
    websiteName: s.websiteName,
    websiteUrl: s.websiteUrl,
    proofText: s.proofText,
    status: s.status,
    earnedAmount: parseFloat(s.earnedAmount ?? "0.70"),
    createdAt: s.createdAt,
  })));
});

// POST /tasks/submit — user submits proof
router.post("/tasks/submit", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { websiteName, websiteUrl, proofText } = req.body;

  if (!websiteName || !websiteUrl || !proofText?.trim()) {
    res.status(400).json({ error: "Website name, URL, and proof are required" });
    return;
  }

  const task = TASK_WEBSITES.find(t => t.name === websiteName);
  if (!task) { res.status(400).json({ error: "Unknown task website" }); return; }

  const existing = await db.select({ id: taskSubmissionsTable.id })
    .from(taskSubmissionsTable)
    .where(and(
      eq(taskSubmissionsTable.userId, userId),
      eq(taskSubmissionsTable.websiteName, websiteName),
      eq(taskSubmissionsTable.status, "pending"),
    )).limit(1);

  if (existing.length > 0) {
    res.status(400).json({ error: "You already have a pending submission for this website. Wait for approval first." });
    return;
  }

  await db.insert(taskSubmissionsTable).values({
    userId, websiteName, websiteUrl, proofText: proofText.trim(),
    status: "pending", earnedAmount: String(task.earn),
  });

  res.json({ message: "Task submitted successfully. Awaiting admin approval." });
});

// GET /admin/tasks — admin views all task submissions
router.get("/admin/tasks", requireAdmin, async (req, res) => {
  const subs = await db.select().from(taskSubmissionsTable)
    .orderBy(sql`${taskSubmissionsTable.createdAt} DESC`);

  const userIds = [...new Set(subs.map(s => s.userId))];
  let usersMap: Record<number, any> = {};
  if (userIds.length > 0) {
    const usersData = await db.select({
      id: usersTable.id, email: usersTable.email,
      firstName: usersTable.firstName, lastName: usersTable.lastName,
    }).from(usersTable).where(inArray(usersTable.id, userIds));
    for (const u of usersData) usersMap[u.id] = u;
  }

  res.json(subs.map(s => ({
    id: s.id, userId: s.userId, websiteName: s.websiteName,
    websiteUrl: s.websiteUrl, proofText: s.proofText, status: s.status,
    earnedAmount: parseFloat(s.earnedAmount ?? "0.70"),
    createdAt: s.createdAt, user: usersMap[s.userId] ?? null,
  })));
});

// POST /admin/tasks/:id/approve
router.post("/admin/tasks/:id/approve", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const subs = await db.select().from(taskSubmissionsTable)
    .where(eq(taskSubmissionsTable.id, id)).limit(1);
  if (subs.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  if (subs[0].status !== "pending") { res.status(400).json({ error: "Already reviewed" }); return; }

  const earned = parseFloat(subs[0].earnedAmount ?? "0.70");
  await db.update(taskSubmissionsTable).set({ status: "approved" }).where(eq(taskSubmissionsTable.id, id));
  await db.update(usersTable)
    .set({ balance: sql`${usersTable.balance} + ${earned}` })
    .where(eq(usersTable.id, subs[0].userId));

  res.json({ message: `Task approved. $${earned.toFixed(2)} credited.` });
});

// POST /admin/tasks/:id/decline
router.post("/admin/tasks/:id/decline", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const subs = await db.select().from(taskSubmissionsTable)
    .where(eq(taskSubmissionsTable.id, id)).limit(1);
  if (subs.length === 0) { res.status(404).json({ error: "Not found" }); return; }

  await db.update(taskSubmissionsTable).set({ status: "declined" }).where(eq(taskSubmissionsTable.id, id));
  res.json({ message: "Task declined." });
});

export default router;
