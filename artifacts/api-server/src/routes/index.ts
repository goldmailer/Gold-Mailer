import postbacksRouter from "./postbacks";
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import userRouter from "./user";
import cardsRouter from "./cards";
import transactionsRouter from "./transactions";
import adminRouter from "./admin";
import supportRouter from "./support";
import tasksRouter from "./tasks";
import referralRouter from "./referral";
import inboxRouter from "./inbox";
import smsRouter from "./sms";
import settingsRouter from "./settings";
import marketplaceRouter from "./marketplace";
import publicRouter from "./public";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(userRouter);
router.use(cardsRouter);
router.use(transactionsRouter);
router.use(adminRouter);
router.use(supportRouter);
router.use(tasksRouter);
router.use(referralRouter);
router.use(inboxRouter);
router.use(smsRouter);
router.use(settingsRouter);
router.use(marketplaceRouter);
router.use(publicRouter);
router.use(postbacksRouter);

export default router;
