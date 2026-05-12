import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const cardsTable = pgTable("cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  cardholderName: text("cardholder_name").notNull(),
  cardNumber: text("card_number").notNull(),
  expiryDate: text("expiry_date").notNull(),
  cvv: text("cvv").notNull(),
  billingAddress1: text("billing_address_1").notNull(),
  billingAddress2: text("billing_address_2"),
  billingCity: text("billing_city").notNull(),
  billingState: text("billing_state").notNull(),
  billingCountry: text("billing_country").notNull().default("Nigeria"),
  billingZip: text("billing_zip").notNull(),
  aptNumber: text("apt_number"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Card = typeof cardsTable.$inferSelect;
