import { pgTable, serial, text, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  plainPassword: text("plain_password").notNull(),
  firstName: text("first_name"),
  middleName: text("middle_name"),
  lastName: text("last_name"),
  age: integer("age"),
  gender: text("gender"),
  avatarUrl: text("avatar_url"),
  isVerified: boolean("is_verified").notNull().default(false),
  profileComplete: boolean("profile_complete").notNull().default(false),
  cardAdded: boolean("card_added").notNull().default(false),
  balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  isAdmin: boolean("is_admin").notNull().default(false),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  country: text("country").default("NG"),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
