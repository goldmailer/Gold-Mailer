import { boolean, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

export const adsSettingsTable = pgTable("ads_settings", {
  id: serial("id").primaryKey(),
  heroPageAdsEnabled: boolean("hero_page_ads_enabled").notNull().default(false),
  dashboardAdsEnabled: boolean("dashboard_ads_enabled").notNull().default(false),
  withdrawPageAdsEnabled: boolean("withdraw_page_ads_enabled").notNull().default(false),
  generalAdsEnabled: boolean("general_ads_enabled").notNull().default(false),
  sidebarAdsEnabled: boolean("sidebar_ads_enabled").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AdsSettings = typeof adsSettingsTable.$inferSelect;