import { pgTable, serial, integer, numeric, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const stakesTable = pgTable("stakes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  profit: numeric("profit", { precision: 15, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("active"), // active | completed | withdrawn
  totalDailyClaimed: numeric("total_daily_claimed", { precision: 15, scale: 2 }).notNull().default("0"),
  lastDailyClaim: timestamp("last_daily_claim"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Stake = typeof stakesTable.$inferSelect;
