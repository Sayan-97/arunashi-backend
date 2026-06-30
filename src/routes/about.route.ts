import { Router } from "express";
import {
	getAboutController,
	updateAboutController,
} from "../controllers/about.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router: Router = Router();

router.get("/", getAboutController);
router.put("/", authenticate, updateAboutController);

export default router;
export { router as AboutRouter };
