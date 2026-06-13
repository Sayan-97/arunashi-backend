import { activateAccountController } from "@/controllers/auth.controller";
import { Router } from "express";

const router: Router = Router();

router.post("/activate", activateAccountController);

export { router as AuthRouter };
