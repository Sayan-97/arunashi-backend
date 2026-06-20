import { Router } from "express";
import {
	getProductsController,
	getCollectionsController,
	getAdminProductsController,
	activateProductController,
	deactivateProductController,
	submitProductRequestController,
	getUserRequestsController,
	getAllRequestsController,
	updateRequestStatusController,
	updateLinesheetLinkController,
	syncProductsController,
} from "@/controllers/product.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";

const router: Router = Router();

router.get("/", getProductsController);
router.get("/collections", getCollectionsController);
router.get(
	"/admin",
	authenticate,
	authorize("ADMIN"),
	getAdminProductsController,
);
router.post("/sync", authenticate, authorize("ADMIN"), syncProductsController);
router.post(
	"/:id/activate",
	authenticate,
	authorize("ADMIN"),
	activateProductController,
);
router.post(
	"/:id/deactivate",
	authenticate,
	authorize("ADMIN"),
	deactivateProductController,
);
router.put(
	"/:id/linesheet",
	authenticate,
	authorize("ADMIN"),
	updateLinesheetLinkController,
);

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
