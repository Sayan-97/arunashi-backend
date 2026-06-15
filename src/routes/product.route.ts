import { Router } from "express";
import {
	getProductsController,
	submitProductRequestController,
	getUserRequestsController,
	getAllRequestsController,
	updateRequestStatusController,
} from "@/controllers/product.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";

const router: Router = Router();

router.get("/", getProductsController);

router.post("/requests", authenticate, submitProductRequestController);
router.get("/requests/my", authenticate, getUserRequestsController);
router.get(
	"/requests/admin",
	authenticate,
	authorize("ADMIN"),
	getAllRequestsController,
);
router.patch(
	"/requests/admin/:id/status",
	authenticate,
	authorize("ADMIN"),
	updateRequestStatusController,
);

export { router as ProductRouter };
