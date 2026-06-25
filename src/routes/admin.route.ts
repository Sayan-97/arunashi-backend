import {
	approveRegistrationController,
	getPendingRegistrationsController,
	getApprovedRetailersController,
	changePasswordController,
	getAuditLogsController,
	resendActivationController,
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
router.post(
	"/registrations/:id/resend-activation",
	authenticate,
	authorize("ADMIN"),
	resendActivationController,
);

router.post(
	"/settings/change-password",
	authenticate,
	authorize("ADMIN"),
	changePasswordController,
);
router.get(
	"/settings/logs",
	authenticate,
	authorize("ADMIN"),
	getAuditLogsController,
);

export { router as AdminRouter };
