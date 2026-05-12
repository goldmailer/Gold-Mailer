import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, otpCodesTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email";
import { requireAuth } from "../lib/auth-middleware";

const router = Router();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function otpExpiry(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 20);
  return d;
}

// POST /auth/register
router.post("/auth/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0 && existing[0].isVerified) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  if (existing.length > 0 && !existing[0].isVerified) {
    // Account exists but unverified — update password and resend OTP
    await db.update(usersTable).set({ passwordHash, plainPassword: password }).where(eq(usersTable.email, email.toLowerCase()));
  } else {
    await db.insert(usersTable).values({
      email: email.toLowerCase(),
      passwordHash,
      plainPassword: password,
    });
  }
  const code = generateOtp();
  await db.insert(otpCodesTable).values({
    email: email.toLowerCase(),
    code,
    type: "verify_email",
    expiresAt: otpExpiry(),
  });
  let emailError = false;
  try {
    await sendVerificationEmail(email.toLowerCase(), code);
  } catch (err) {
    emailError = true;
    req.log.error({ err }, "Failed to send verification email");
    req.log.warn({ email: email.toLowerCase(), otp: code }, "EMAIL FAILED — OTP code for manual use");
  }
  const isDev = process.env.NODE_ENV !== "production";
  res.status(201).json({
    message: "Registration successful. Check your email for the verification code.",
    ...(isDev && emailError ? { devCode: code } : {}),
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

  res.json({ message: "Email verified successfully" });
});

// POST /auth/resend-verification
router.post("/auth/resend-verification", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (users.length === 0) {
    res.json({ message: "If this email exists, a new code was sent." });
    return;
  }
  const code = generateOtp();
  await db.insert(otpCodesTable).values({
    email: email.toLowerCase(),
    code,
    type: "verify_email",
    expiresAt: otpExpiry(),
  });
  let emailError = false;
  try {
    await sendVerificationEmail(email.toLowerCase(), code);
  } catch (err) {
    emailError = true;
    req.log.error({ err }, "Failed to send verification email");
    req.log.warn({ email: email.toLowerCase(), otp: code }, "EMAIL FAILED — OTP code for manual use");
  }
  const isDev = process.env.NODE_ENV !== "production";
  res.json({
    message: "Verification code resent. Check your email.",
    ...(isDev && emailError ? { devCode: code } : {}),
  });
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
  res.json({
    message: "Login successful",
    user: {
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
      createdAt: user.createdAt.toISOString(),
    },
  });
});

// POST /auth/forgot-password
router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email?.toLowerCase())).limit(1);
  if (users.length > 0) {
    const code = generateOtp();
    await db.insert(otpCodesTable).values({
      email: email.toLowerCase(),
      code,
      type: "reset_password",
      expiresAt: otpExpiry(),
    });
    try {
      await sendPasswordResetEmail(email.toLowerCase(), code);
    } catch (err) {
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
  res.json({
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
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
