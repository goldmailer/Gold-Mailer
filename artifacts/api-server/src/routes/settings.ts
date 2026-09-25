import { Router } from "express";
import { adsSettingsTable, db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth-middleware";

const router = Router();

// GET /settings/card-required
router.get("/settings/card-required", async (_req, res) => {
  const row = await db.select().from(settingsTable).where(eq(settingsTable.key, "card_required")).limit(1);
  const required = row.length === 0 ? true : row[0].value !== "false";
  res.json({ required });
});

// GET /settings/crypto-wallets
router.get("/settings/crypto-wallets", async (_req, res) => {
  const row = await db.select().from(settingsTable).where(eq(settingsTable.key, "crypto_wallets")).limit(1);
  const wallets = row.length === 0 ? [] : JSON.parse(row[0].value);
  res.json({ wallets });
});

const defaultAdsSettings = {
  heroPageAdsEnabled: true,
  dashboardAdsEnabled: true,
  withdrawPageAdsEnabled: true,
  generalAdsEnabled: true,
  sidebarAdsEnabled: true,
};

function serializeAdsSettings(row: typeof adsSettingsTable.$inferSelect | undefined) {
  return {
    heroPageAdsEnabled: row?.heroPageAdsEnabled ?? defaultAdsSettings.heroPageAdsEnabled,
    dashboardAdsEnabled: row?.dashboardAdsEnabled ?? defaultAdsSettings.dashboardAdsEnabled,
    withdrawPageAdsEnabled: row?.withdrawPageAdsEnabled ?? defaultAdsSettings.withdrawPageAdsEnabled,
    generalAdsEnabled: row?.generalAdsEnabled ?? defaultAdsSettings.generalAdsEnabled,
    sidebarAdsEnabled: row?.sidebarAdsEnabled ?? defaultAdsSettings.sidebarAdsEnabled,
  };
}

// GET /settings/ads — public so ad placements can decide whether to render.
router.get("/settings/ads", async (_req, res) => {
  const [row] = await db.select().from(adsSettingsTable).limit(1);
  res.json(serializeAdsSettings(row));
});

// GET /admin/ads-settings — public master switches (main banner + popup) used by
// the site-wide AdBanner / PopunderAd components to decide whether to render.
router.get("/admin/ads-settings", async (_req, res) => {
  const [row] = await db.select().from(adsSettingsTable).limit(1);
  res.json({
    main: row?.mainAdsEnabled ?? true,
    popup: row?.popupAdsEnabled ?? true,
  });
});

// POST /admin/ads-settings — admin-only update of the master ad switches.
router.post("/admin/ads-settings", requireAdmin, async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const main = typeof body.main === "boolean" ? body.main : true;
  const popup = typeof body.popup === "boolean" ? body.popup : true;
  const currentRows = await db.select().from(adsSettingsTable).limit(1);
  if (currentRows[0]) {
    await db.update(adsSettingsTable)
      .set({ mainAdsEnabled: main, popupAdsEnabled: popup, updatedAt: new Date() })
      .where(eq(adsSettingsTable.id, currentRows[0].id));
  } else {
    await db.insert(adsSettingsTable).values({ mainAdsEnabled: main, popupAdsEnabled: popup });
  }
  res.json({ main, popup });
});

// PUT /settings/ads — only an authenticated admin can change ad placements.
router.put("/settings/ads", requireAdmin, async (req, res) => {
  const currentRows = await db.select().from(adsSettingsTable).limit(1);
  const current = serializeAdsSettings(currentRows[0]);
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const next = {
    heroPageAdsEnabled: typeof body.heroPageAdsEnabled === "boolean" ? body.heroPageAdsEnabled : current.heroPageAdsEnabled,
    dashboardAdsEnabled: typeof body.dashboardAdsEnabled === "boolean" ? body.dashboardAdsEnabled : current.dashboardAdsEnabled,
    withdrawPageAdsEnabled: typeof body.withdrawPageAdsEnabled === "boolean" ? body.withdrawPageAdsEnabled : current.withdrawPageAdsEnabled,
    generalAdsEnabled: typeof body.generalAdsEnabled === "boolean" ? body.generalAdsEnabled : current.generalAdsEnabled,
    sidebarAdsEnabled: typeof body.sidebarAdsEnabled === "boolean" ? body.sidebarAdsEnabled : current.sidebarAdsEnabled,
  };

  if (currentRows[0]) {
    await db.update(adsSettingsTable)
      .set({ ...next, updatedAt: new Date() })
      .where(eq(adsSettingsTable.id, currentRows[0].id));
  } else {
    await db.insert(adsSettingsTable).values(next);
  }
  res.json(next);
});

export default router;
