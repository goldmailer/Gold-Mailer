import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const kycSubmissionsTable = pgTable("kyc_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  idType: text("id_type").notNull(),
  idImageUrl: text("id_image_url").notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type KycSubmission = typeof kycSubmissionsTable.$inferSelect;
