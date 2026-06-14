import { getProfileController } from "@/controllers/user.controller";
import { Router } from "express";
import { authenticate } from "@/middlewares/auth.middleware";

const router: Router = Router();

router.post("/profile", authenticate, getProfileController);

export { router as UserRouter };
