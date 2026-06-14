import {
	activateAccountController,
	loginController,
} from "@/controllers/auth.controller";
import { Router } from "express";

const router: Router = Router();

router.post("/activate", activateAccountController);
router.post("/login", loginController);

export { router as AuthRouter };
