import { Router } from "express";
import { db, usersTable, taskSubmissionsTable } from "@workspace/db";
import { eq, sql, and, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth-middleware";
import { checkTelegramChannelMember } from "../lib/telegram";

const router = Router();

export const TASK_WEBSITES = [
  { id: 1, name: "SurveyMonkey", url: "https://www.surveymonkey.com", earn: 0.70, forNG: false, taskType: "Survey/Questionnaire" },
  { id: 2, name: "Google Forms", url: "https://forms.google.com", earn: 0.70, forNG: false, taskType: "Survey/Questionnaire" },
  { id: 3, name: "Typeform", url: "https://www.typeform.com", earn: 0.70, forNG: false, taskType: "Survey/Questionnaire" },
  { id: 4, name: "Qualtrics", url: "https://www.qualtrics.com", earn: 0.70, forNG: false, taskType: "Survey/Questionnaire" },
  { id: 5, name: "Jotform", url: "https://www.jotform.com", earn: 0.70, forNG: false, taskType: "Survey/Questionnaire" },
  { id: 6, name: "Microsoft Forms", url: "https://forms.microsoft.com", earn: 0.70, forNG: false, taskType: "Survey/Questionnaire" },
  { id: 7, name: "SurveySparrow", url: "https://surveysparrow.com", earn: 0.70, forNG: false, taskType: "Survey/Questionnaire" },
  { id: 8, name: "LimeSurvey", url: "https://www.limesurvey.org", earn: 0.70, forNG: false, taskType: "Survey/Questionnaire" },
  { id: 9, name: "Pollfish", url: "https://www.pollfish.com", earn: 0.70, forNG: false, taskType: "Survey/Questionnaire" },
  { id: 10, name: "Prolific", url: "https://www.prolific.com", earn: 0.70, forNG: false, taskType: "Survey/Questionnaire" },
  { id: 11, name: "Freecash", url: "https://freecash.com", earn: 0.70, forNG: false, taskType: "App & Web tasks" },
  { id: 12, name: "Socialearning", url: "https://socialearning.com", earn: 0.70, forNG: true, taskType: "Engagement & Reviews" },
  { id: 13, name: "SproutGigs", url: "https://sproutgigs.com", earn: 0.70, forNG: true, taskType: "App & Web tasks" },
  { id: 14, name: "Microworkers", url: "https://microworkers.com", earn: 0.70, forNG: true, taskType: "App & Web tasks" },
  { id: 15, name: "RapidWorkers", url: "https://rapidworkers.com", earn: 0.70, forNG: true, taskType: "App & Web tasks" },
  { id: 16, name: "Clickworker", url: "https://www.clickworker.com", earn: 0.70, forNG: true, taskType: "App & Web tasks" },
  { id: 17, name: "Amazon Mechanical Turk", url: "https://www.mturk.com", earn: 0.70, forNG: true, taskType: "App & Web tasks" },
  { id: 18, name: "Hive Micro", url: "https://hivemicro.com", earn: 0.70, forNG: true, taskType: "App & Web tasks" },
  { id: 19, name: "Appen", url: "https://appen.com", earn: 0.70, forNG: true, taskType: "App & Web tasks" },
  { id: 20, name: "Toloka", url: "https://toloka.ai", earn: 0.70, forNG: true, taskType: "App & Web tasks" },
  { id: 21, name: "Telegram Community Channel", url: "https://t.me/tasknestcommunity", earn: 0.50, forNG: false, taskType: "Join Telegram Channel" },
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
    taskId: s.taskId,
    websiteName: s.websiteName,
    websiteUrl: s.websiteUrl,
    screenshotUrl: s.screenshotUrl,
    submittedUsername: s.submittedUsername,
    proofText: s.proofText,
    status: s.status,
    earnedAmount: parseFloat(s.earnedAmount ?? "0.70"),
    telegramVerified: s.telegramVerified,
    createdAt: s.createdAt,
  })));
});

// POST /tasks/submit — user submits proof with Screenshot (required) & Username (required)
router.post("/tasks/submit", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const {
    taskId,
    websiteName,
    websiteUrl,
    screenshotUrl,
    submittedUsername,
    proofText = "",
  } = req.body;

  if (!screenshotUrl || !screenshotUrl.trim()) {
    res.status(400).json({ error: "Upload Screenshot is required to verify task completion" });
    return;
  }

  if (!submittedUsername || !submittedUsername.trim()) {
    res.status(400).json({ error: "Please enter the username you used to perform the task" });
    return;
  }

  const cleanName = String(websiteName || "Task #" + (taskId || "1")).trim();
  const cleanUrl = String(websiteUrl || "").trim();
  const parsedTaskId = taskId ? parseInt(String(taskId)) : null;

  // Find reward amount
  let reward = 0.70;
  const standardTask = TASK_WEBSITES.find(t => (parsedTaskId && t.id === parsedTaskId) || t.name === cleanName);
  if (standardTask) {
    reward = standardTask.earn;
  }

  // Telegram auto-check
  const isTelegramTask = cleanName.toLowerCase().includes("telegram") ||
    cleanUrl.toLowerCase().includes("t.me") ||
    (req.body.taskType && String(req.body.taskType).toLowerCase().includes("telegram"));

  let isAutoApproved = false;
  let telegramStatus = "no";

  if (isTelegramTask) {
    const check = await checkTelegramChannelMember(cleanUrl, submittedUsername.trim());
    if (check.joined) {
      isAutoApproved = true;
      telegramStatus = "verified";
    } else {
      telegramStatus = check.status;
    }
  }

  const initialStatus = isAutoApproved ? "approved" : "pending";

  const inserted = await db.insert(taskSubmissionsTable).values({
    taskId: parsedTaskId,
    userId,
    websiteName: cleanName,
    websiteUrl: cleanUrl,
    screenshotUrl: screenshotUrl.trim(),
    submittedUsername: submittedUsername.trim(),
    proofText: proofText.trim() || `Submitted by ${submittedUsername.trim()}`,
    status: initialStatus,
    earnedAmount: String(reward),
    telegramVerified: telegramStatus,
  }).returning();

  // If auto-approved via Telegram Bot API, credit user balance immediately
  if (isAutoApproved) {
    await db.update(usersTable)
      .set({ balance: sql`${usersTable.balance} + ${reward}` })
      .where(eq(usersTable.id, userId));
    res.json({
      success: true,
      autoApproved: true,
      message: `Telegram membership verified automatically! $${reward.toFixed(2)} credited to your balance.`,
      submission: inserted[0],
    });
    return;
  }

  res.json({
    success: true,
    autoApproved: false,
    message: "Proof submitted successfully. Awaiting admin review.",
    submission: inserted[0],
  });
});

// GET /admin/tasks — admin views all task submissions
router.get("/admin/tasks", requireAdmin, async (req, res) => {
  const subs = await db.select().from(taskSubmissionsTable)
    .orderBy(sql`${taskSubmissionsTable.createdAt} DESC`);

  const userIds = [...new Set(subs.map(s => s.userId))];
  let usersMap: Record<number, any> = {};
  if (userIds.length > 0) {
    const usersData = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      balance: usersTable.balance,
      telegramHandle: usersTable.telegramHandle,
    }).from(usersTable).where(inArray(usersTable.id, userIds));
    for (const u of usersData) usersMap[u.id] = u;
  }

  res.json(subs.map(s => ({
    id: s.id,
    taskId: s.taskId,
    userId: s.userId,
    websiteName: s.websiteName,
    websiteUrl: s.websiteUrl,
    screenshotUrl: s.screenshotUrl,
    submittedUsername: s.submittedUsername,
    proofText: s.proofText,
    status: s.status,
    earnedAmount: parseFloat(s.earnedAmount ?? "0.70"),
    telegramVerified: s.telegramVerified,
    createdAt: s.createdAt,
    user: usersMap[s.userId] ?? null,
  })));
});

// POST /admin/tasks/:id/approve — admin approves task submission and adds reward to user balance
router.post("/admin/tasks/:id/approve", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const subs = await db.select().from(taskSubmissionsTable)
    .where(eq(taskSubmissionsTable.id, id)).limit(1);

  if (subs.length === 0) {
    res.status(404).json({ error: "Task submission not found" });
    return;
  }
  if (subs[0].status === "approved") {
    res.status(400).json({ error: "Submission already approved" });
    return;
  }

  const earned = parseFloat(subs[0].earnedAmount ?? "0.70");
  await db.update(taskSubmissionsTable).set({ status: "approved" }).where(eq(taskSubmissionsTable.id, id));
  await db.update(usersTable)
    .set({ balance: sql`${usersTable.balance} + ${earned}` })
    .where(eq(usersTable.id, subs[0].userId));

  res.json({ success: true, message: `Submission approved. $${earned.toFixed(2)} added to user balance.` });
});

// POST /admin/tasks/:id/decline / reject
router.post("/admin/tasks/:id/decline", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const subs = await db.select().from(taskSubmissionsTable)
    .where(eq(taskSubmissionsTable.id, id)).limit(1);

  if (subs.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.update(taskSubmissionsTable).set({ status: "rejected" }).where(eq(taskSubmissionsTable.id, id));
  res.json({ success: true, message: "Task submission rejected." });
});

router.post("/admin/tasks/:id/reject", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const subs = await db.select().from(taskSubmissionsTable)
    .where(eq(taskSubmissionsTable.id, id)).limit(1);

  if (subs.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.update(taskSubmissionsTable).set({ status: "rejected" }).where(eq(taskSubmissionsTable.id, id));
  res.json({ success: true, message: "Task submission rejected." });
});

// POST /admin/tasks/:id/check-telegram — run live Telegram Bot check
router.post("/admin/tasks/:id/check-telegram", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const subs = await db.select().from(taskSubmissionsTable)
    .where(eq(taskSubmissionsTable.id, id)).limit(1);

  if (subs.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const sub = subs[0];
  const target = sub.websiteUrl;
  const username = sub.submittedUsername || "";

  const check = await checkTelegramChannelMember(target, username);
  if (check.joined) {
    await db.update(taskSubmissionsTable).set({ telegramVerified: "verified" }).where(eq(taskSubmissionsTable.id, id));
  }

  res.json(check);
});

export default router;
