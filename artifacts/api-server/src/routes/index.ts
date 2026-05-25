import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import userRouter from "./user";
import cardsRouter from "./cards";
import stakesRouter from "./stakes";
import transactionsRouter from "./transactions";
import adminRouter from "./admin";
import supportRouter from "./support";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(userRouter);
router.use(cardsRouter);
router.use(stakesRouter);
router.use(transactionsRouter);
router.use(adminRouter);
router.use(supportRouter);

export default router;
