import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";

export const taskSubmissionsTable = pgTable("task_submissions", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id"),
  userId: integer("user_id").notNull(),
  screenshotUrl: text("screenshot_url"),
  submittedUsername: text("submitted_username"),
  websiteName: text("website_name").notNull().default(""),
  websiteUrl: text("website_url").notNull().default(""),
  proofText: text("proof_text").notNull().default(""),
  status: text("status").notNull().default("pending"),
  earnedAmount: numeric("earned_amount", { precision: 10, scale: 2 }).default("0.70"),
  telegramVerified: text("telegram_verified").default("no"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TaskSubmission = typeof taskSubmissionsTable.$inferSelect;
