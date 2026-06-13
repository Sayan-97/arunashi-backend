import { approveRegistrationController } from "@/controllers/admin.controller";
import { Router } from "express";

const router: Router = Router();

router.post("/registrations/:id/approve", approveRegistrationController);

export { router as AdminRouter };
