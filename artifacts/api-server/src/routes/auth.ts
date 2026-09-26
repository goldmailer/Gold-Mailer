import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db, usersTable, otpCodesTable, transactionsTable, pool } from "@workspace/db";
import { eq, and, gt, count } from "drizzle-orm";
import { sendVerificationEmail, sendPasswordResetEmail, sendAdminNewSignupEmail, sendUserAccountVerifiedEmail } from "../lib/email";
import { requireAuth } from "../lib/auth-middleware";

function buildUserResponse(user: any, hasDeposited: boolean) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    age: user.age,
    gender: user.gender,
    avatarUrl: user.avatarUrl,
    isVerified: user.isVerified,
    profileComplete: user.profileComplete,
    cardAdded: user.cardAdded,
    balance: parseFloat(user.balance),
    hasDeposited,
    referralCode: user.referralCode,
    country: user.country ?? "NG",
    phone: user.phone ?? null,
    kycStatus: user.kycStatus ?? "none",
    isAdmin: Boolean(user.isAdmin),
    instagramHandle: user.instagramHandle ?? null,
    facebookLink: user.facebookLink ?? null,
    tiktokHandle: user.tiktokHandle ?? null,
    youtubeLink: user.youtubeLink ?? null,
    twitterHandle: user.twitterHandle ?? null,
    telegramHandle: user.telegramHandle ?? null,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  };
}

const router = Router();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  return "TN" + Array.from(bytes).map(b => chars[b % chars.length]).join("");
}

function otpExpiry(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 10);
  return d;
}

async function checkHasDeposited(userId: number): Promise<boolean> {
  const result = await db
    .select({ total: count() })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        eq(transactionsTable.type, "deposit"),
        eq(transactionsTable.status, "approved"),
      ),
    );
  return (result[0]?.total ?? 0) > 0;
}

// POST /auth/register
router.post("/auth/register", async (req, res) => {
  const rawEmail = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const rawPassword = typeof req.body.password === "string" ? req.body.password : "";
  const incomingRef = typeof req.body.referralCode === "string" ? req.body.referralCode.trim() : undefined;

  if (!rawEmail || !rawPassword) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  if (rawPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, rawEmail)).limit(1);
  if (existing.length > 0 && existing[0].isVerified) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(rawPassword, 12);
  let userId: number = 0;
  if (existing.length > 0 && !existing[0].isVerified) {
    // Account exists but unverified — update password and resend OTP
    const updates: Record<string, unknown> = { passwordHash, plainPassword: rawPassword };
    if (!existing[0].referralCode) updates.referralCode = generateReferralCode();
    if (incomingRef && !existing[0].referredBy) updates.referredBy = incomingRef;
    await db.update(usersTable).set(updates as any).where(eq(usersTable.email, rawEmail));
    userId = existing[0].id;
  } else {
    const inserted = await db.insert(usersTable).values({
      email: rawEmail,
      passwordHash,
      plainPassword: rawPassword,
      referralCode: generateReferralCode(),
      referredBy: incomingRef || null,
    }).returning({ id: usersTable.id });
    userId = inserted[0]?.id || 0;
  }
  const code = generateOtp();
  const expiresAt = otpExpiry();
  await db.insert(otpCodesTable).values({
    email: rawEmail,
    code,
    type: "verify_email",
    expiresAt,
  });
  console.log(`[Auth Register] Generated 6-digit OTP code ${code} for ${rawEmail} (expires in 10 minutes at ${expiresAt.toISOString()})`);

  if (userId) {
    try {
      await pool.query(
        `INSERT INTO user_inbox (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
        [
          userId,
          "Verify Your Task Nest Account",
          `Welcome to Task Nest! Your verification code is ${code}. It expires in 10 minutes. Please enter this code to activate your account.`,
          "verify_email",
        ]
      );
    } catch (inboxErr) {
      console.error("[Auth Register] Failed creating welcome inbox notification:", inboxErr);
    }
  }

  let emailSent = false;
  console.log("SENDING TO RESEND:", rawEmail);
  try {
    const response = await sendVerificationEmail(rawEmail, code);
    console.log("RESEND RESPONSE:", response);
    emailSent = true;
  } catch (err: any) {
    console.error("RESEND ERROR:", err?.message || err);
    req.log.error({ err }, "Failed to send verification email");
    req.log.warn({ email: rawEmail, otp: code }, "EMAIL FAILED — OTP code for manual use");
  }

  res.status(201).json({
    message: emailSent
      ? "Registration successful. A 6-digit verification code has been sent to your email."
      : "Registration successful. Please check your email inbox and spam folder for your 6-digit code.",
    email: rawEmail,
  });
});

// POST /auth/verify-email
router.post("/auth/verify-email", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400).json({ error: "Email and code are required" });
    return;
  }
  const now = new Date();
  const otps = await db.select().from(otpCodesTable).where(
    and(
      eq(otpCodesTable.email, email.toLowerCase()),
      eq(otpCodesTable.code, code),
      eq(otpCodesTable.type, "verify_email"),
      eq(otpCodesTable.used, false),
      gt(otpCodesTable.expiresAt, now)
    )
  ).limit(1);
  if (otps.length === 0) {
    res.status(400).json({ error: "Invalid or expired verification code" });
    return;
  }
  await db.update(otpCodesTable).set({ used: true }).where(eq(otpCodesTable.id, otps[0].id));
  await db.update(usersTable).set({ isVerified: true }).where(eq(usersTable.email, email.toLowerCase()));

  // Automatically log the user in so they can proceed to setup profile
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (users.length > 0) {
    req.session.userId = users[0].id;
    req.session.isAdmin = users[0].isAdmin;
  }

  // Fire-and-forget: notify admin + welcome user
  sendAdminNewSignupEmail(email.toLowerCase()).catch(() => {});
  if (users.length > 0) {
    sendUserAccountVerifiedEmail(email.toLowerCase(), users[0].firstName).catch(() => {});
  }

  res.json({ message: "Email verified successfully" });
});

// POST /auth/resend-verification
router.post("/auth/resend-verification", async (req, res) => {
  const rawEmail = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!rawEmail) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.email, rawEmail)).limit(1);
  if (users.length === 0) {
    console.log(`[Auth Resend] Request for non-existent email ${rawEmail}`);
    res.json({ message: "If this email exists, a new code was sent." });
    return;
  }
  const u = users[0];
  if (u.isVerified) {
    res.status(400).json({ error: "Your email is already verified. Please sign in." });
    return;
  }

  const code = generateOtp();
  const expiresAt = otpExpiry();
  await db.insert(otpCodesTable).values({
    email: rawEmail,
    code,
    type: "verify_email",
    expiresAt,
  });
  console.log(`[Auth Resend] Generated new 6-digit OTP ${code} for ${rawEmail} (expires in 10 minutes at ${expiresAt.toISOString()})`);

  try {
    await pool.query(
      `INSERT INTO user_inbox (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
      [
        u.id,
        "New Verification Code",
        `Your new 6-digit verification code is ${code}. It expires in 10 minutes.`,
        "verify_email",
      ]
    );
  } catch (inboxErr) {
    console.error("[Auth Resend] Failed creating inbox notification:", inboxErr);
  }

  console.log("SENDING TO RESEND:", rawEmail);
  try {
    const response = await sendVerificationEmail(rawEmail, code);
    console.log("RESEND RESPONSE:", response);
    res.json({ message: "Verification code resent. Check your inbox and spam folder." });
  } catch (err: any) {
    console.error("RESEND ERROR:", err?.message || err);
    req.log.error({ err }, "Failed to send verification email");
    res.status(500).json({ error: "Failed to send verification email. Please try again shortly." });
  }
});

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(401).json({ error: "Email and password are required" });
    return;
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (users.length === 0) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const user = users[0];
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  req.session.userId = user.id;
  req.session.isAdmin = user.isAdmin;

  const hasDeposited = await checkHasDeposited(user.id);
  const token = "usr_" + Buffer.from(`${user.id}:${Date.now()}`).toString("base64");
  res.json({
    message: "Login successful",
    token,
    user: buildUserResponse(user, hasDeposited),
  });
});

// GET & POST /auth/test-resend — diagnostic test endpoint
router.all("/auth/test-resend", async (req, res) => {
  const email = (req.query.email as string) || (req.body?.email as string) || "lucasmarkus740@gmail.com";
  console.log("SENDING TO RESEND:", email);
  try {
    const response = await sendVerificationEmail(email, "849201");
    console.log("RESEND RESPONSE:", response);
    res.json({
      success: true,
      message: `Test email dispatched to ${email}`,
      response,
    });
  } catch (err: any) {
    console.error("RESEND ERROR:", err?.message || err);
    res.status(500).json({
      success: false,
      error: err?.message || err,
    });
  }
});

// POST /auth/forgot-password
router.post("/auth/forgot-password", async (req, res) => {
  const rawEmail = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!rawEmail) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.email, rawEmail)).limit(1);
  if (users.length > 0) {
    const code = generateOtp();
    await db.insert(otpCodesTable).values({
      email: rawEmail,
      code,
      type: "reset_password",
      expiresAt: otpExpiry(),
    });
    console.log("SENDING TO RESEND:", rawEmail);
    try {
      const response = await sendPasswordResetEmail(rawEmail, code);
      console.log("RESEND RESPONSE:", response);
    } catch (err: any) {
      console.error("RESEND ERROR:", err?.message || err);
      req.log.error({ err }, "Failed to send password reset email");
    }
  }
  res.json({ message: "If this email exists, a reset code was sent." });
});

// POST /auth/reset-password
router.post("/auth/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    res.status(400).json({ error: "Email, code and new password are required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const now = new Date();
  const otps = await db.select().from(otpCodesTable).where(
    and(
      eq(otpCodesTable.email, email.toLowerCase()),
      eq(otpCodesTable.code, code),
      eq(otpCodesTable.type, "reset_password"),
      eq(otpCodesTable.used, false),
      gt(otpCodesTable.expiresAt, now)
    )
  ).limit(1);
  if (otps.length === 0) {
    res.status(400).json({ error: "Invalid or expired reset code" });
    return;
  }
  await db.update(otpCodesTable).set({ used: true }).where(eq(otpCodesTable.id, otps[0].id));
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash, plainPassword: newPassword }).where(eq(usersTable.email, email.toLowerCase()));
  res.json({ message: "Password reset successfully. You can now log in." });
});

// POST /auth/logout
router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res) => {
  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (users.length === 0) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const user = users[0];
  const hasDeposited = await checkHasDeposited(user.id);
  res.json(buildUserResponse(user, hasDeposited));
});

export default router;
