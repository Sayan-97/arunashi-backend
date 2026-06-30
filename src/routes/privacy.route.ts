import { Router } from "express";
import {
	getPrivacyController,
	updatePrivacyController,
} from "../controllers/privacy.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router: Router = Router();

router.get("/", getPrivacyController);
router.put("/", authenticate, updatePrivacyController);

export default router;
export { router as PrivacyRouter };
