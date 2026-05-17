import { Router } from "express";
import { db, cardsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware";
import { getCountryConfig } from "../lib/currency";

const router = Router();

// GET /cards
router.get("/cards", requireAuth, async (req, res) => {
  const cards = await db.select().from(cardsTable).where(eq(cardsTable.userId, req.session.userId!));
  res.json(cards.map(c => ({
    id: c.id,
    cardholderName: c.cardholderName,
    lastFour: c.cardNumber.slice(-4),
    expiryDate: c.expiryDate,
    billingCity: c.billingCity,
    billingCountry: c.billingCountry,
    createdAt: c.createdAt.toISOString(),
  })));
});

// POST /cards
router.post("/cards", requireAuth, async (req, res) => {
  const { cardholderName, cardNumber, expiryDate, cvv, billingAddress1, billingAddress2, billingCity, billingState, billingCountry, billingZip, aptNumber } = req.body;
  if (!cardholderName || !cardNumber || !expiryDate || !cvv || !billingAddress1 || !billingCity || !billingState || !billingZip) {
    res.status(400).json({ error: "All required card fields must be provided" });
    return;
  }

  // Check if first card (signup bonus)
  const existing = await db.select().from(cardsTable).where(eq(cardsTable.userId, req.session.userId!));
  const isFirstCard = existing.length === 0;

  const inserted = await db.insert(cardsTable).values({
    userId: req.session.userId!,
    cardholderName,
    cardNumber,
    expiryDate,
    cvv,
    billingAddress1,
    billingAddress2: billingAddress2 || null,
    billingCity,
    billingState,
    billingCountry: billingCountry || "Nigeria",
    billingZip,
    aptNumber: aptNumber || null,
  }).returning();

  // Mark card added and give currency-appropriate signup bonus for first card
  if (isFirstCard) {
    // Fetch user to get their country
    const thisUser = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
    const cfg = getCountryConfig(thisUser[0]?.country);

    await db.update(usersTable).set({
      cardAdded: true,
      balance: sql`${usersTable.balance} + ${cfg.signupBonus}`,
    }).where(eq(usersTable.id, req.session.userId!));

    // Credit referrer with their own currency-appropriate bonus
    const referredBy = thisUser[0]?.referredBy;
    if (referredBy) {
      const referrer = await db.select().from(usersTable).where(eq(usersTable.referralCode, referredBy)).limit(1);
      const referrerCfg = getCountryConfig(referrer[0]?.country);
      await db.update(usersTable)
        .set({ balance: sql`${usersTable.balance} + ${referrerCfg.referralBonus}` })
        .where(eq(usersTable.referralCode, referredBy));
    }
  } else {
    await db.update(usersTable).set({ cardAdded: true }).where(eq(usersTable.id, req.session.userId!));
  }

  const card = inserted[0];
  res.status(201).json({
    id: card.id,
    cardholderName: card.cardholderName,
    lastFour: card.cardNumber.slice(-4),
    expiryDate: card.expiryDate,
    billingCity: card.billingCity,
    billingCountry: card.billingCountry,
    createdAt: card.createdAt.toISOString(),
  });
});

// GET /cards/:id - full details
router.get("/cards/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const cards = await db.select().from(cardsTable).where(eq(cardsTable.id, id)).limit(1);
  if (cards.length === 0 || cards[0].userId !== req.session.userId) {
    res.status(404).json({ error: "Card not found" });
    return;
  }
  const c = cards[0];
  res.json({
    id: c.id,
    cardholderName: c.cardholderName,
    cardNumber: c.cardNumber,
    expiryDate: c.expiryDate,
    cvv: c.cvv,
    billingAddress1: c.billingAddress1,
    billingAddress2: c.billingAddress2,
    billingCity: c.billingCity,
    billingState: c.billingState,
    billingCountry: c.billingCountry,
    billingZip: c.billingZip,
    aptNumber: c.aptNumber,
  });
});

export default router;
