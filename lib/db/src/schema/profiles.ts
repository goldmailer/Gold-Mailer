import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  instagram_handle: text("instagram_handle"),
  facebook_link: text("facebook_link"),
  tiktok_handle: text("tiktok_handle"),
  youtube_link: text("youtube_link"),
  twitter_handle: text("twitter_handle"),
  telegram_handle: text("telegram_handle"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Profile = typeof profilesTable.$inferSelect;
