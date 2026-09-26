import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const cpxTransactionsTable = pgTable("cpx_transactions", {
  id: serial("id").primaryKey(),
  transId: text("trans_id").notNull().unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amountUsd: numeric("amount_usd", { precision: 15, scale: 4 }).notNull(),
  coins: integer("coins").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CpxTransaction = typeof cpxTransactionsTable.$inferSelect;
