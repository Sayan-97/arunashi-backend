import { Router } from "express";
import {
	getTermsController,
	updateTermsController,
} from "../controllers/terms.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router: Router = Router();

router.get("/", getTermsController);
router.put("/", authenticate, updateTermsController);

export default router;
export { router as TermsRouter };
