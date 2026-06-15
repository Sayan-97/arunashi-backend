import {
	approveRegistrationController,
	getPendingRegistrationsController,
	getApprovedRetailersController,
} from "@/controllers/admin.controller";
import { Router } from "express";
import { authenticate, authorize } from "@/middlewares/auth.middleware";

const router: Router = Router();

router.get(
	"/registrations/pending",
	authenticate,
	authorize("ADMIN"),
	getPendingRegistrationsController,
);
router.get(
	"/retailers/approved",
	authenticate,
	authorize("ADMIN"),
	getApprovedRetailersController,
);
router.post(
	"/registrations/:id/approve",
	authenticate,
	authorize("ADMIN"),
	approveRegistrationController,
);

export { router as AdminRouter };
