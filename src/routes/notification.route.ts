import { Router } from "express";
import {
	clearNotificationsController,
	getNotificationsController,
	markAllAsReadController,
	markAsReadController,
} from "@/controllers/notification.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";

const router: Router = Router();

router.get("/", authenticate, authorize("ADMIN"), getNotificationsController);

router.patch(
	"/:id/read",
	authenticate,
	authorize("ADMIN"),
	markAsReadController,
);

router.post(
	"/read-all",
	authenticate,
	authorize("ADMIN"),
	markAllAsReadController,
);

router.delete(
	"/",
	authenticate,
	authorize("ADMIN"),
	clearNotificationsController,
);

export { router as NotificationRouter };
