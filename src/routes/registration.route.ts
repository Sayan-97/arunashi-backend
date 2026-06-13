import { registerRequestController } from "@/controllers/registration.controller";
import { Router } from "express";

const router: Router = Router();

router.post("/register", registerRequestController);

export { router as RegistrationRouter };
