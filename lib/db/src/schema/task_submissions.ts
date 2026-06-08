import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";

export const taskSubmissionsTable = pgTable("task_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  websiteName: text("website_name").notNull(),
  websiteUrl: text("website_url").notNull(),
  proofText: text("proof_text").notNull(),
  status: text("status").notNull().default("pending"),
  earnedAmount: numeric("earned_amount", { precision: 10, scale: 2 }).default("0.70"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TaskSubmission = typeof taskSubmissionsTable.$inferSelect;
