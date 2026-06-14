import {
	activateAccountController,
	loginController,
	refreshController,
	logoutController,
	getProfileController,
} from "@/controllers/auth.controller";
import { Router } from "express";
import { authenticate } from "@/middlewares/auth.middleware";

const router: Router = Router();

router.post("/activate", activateAccountController);
router.post("/login", loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);
router.get("/profile", authenticate, getProfileController);

export { router as AuthRouter };
