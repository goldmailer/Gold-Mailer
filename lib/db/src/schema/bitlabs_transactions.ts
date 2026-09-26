import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const bitlabsTransactionsTable = pgTable("bitlabs_transactions", {
  id: serial("id").primaryKey(),
  transactionId: text("transaction_id").notNull().unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  reward: numeric("reward", { precision: 15, scale: 4 }).notNull(),
  coins: integer("coins").notNull(),
  type: text("type").notNull().default("complete"),
  status: text("status").notNull().default("approved"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BitlabsTransaction = typeof bitlabsTransactionsTable.$inferSelect;
