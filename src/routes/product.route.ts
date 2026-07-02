import { Router } from "express";
import {
	getProductsController,
	getCollectionsController,
	createCollectionController,
	updateCollectionController,
	deleteCollectionController,
	getCategoriesController,
	createCategoryController,
	updateCategoryController,
	deleteCategoryController,
	getAdminProductsController,
	activateProductController,
	deactivateProductController,
	submitProductRequestController,
	getUserRequestsController,
	getAllRequestsController,
	updateRequestStatusController,
	updateLinesheetLinkController,
	syncProductsController,
	updateProductCollectionsController,
	updateProductCategoriesController,
} from "@/controllers/product.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { uploadLinesheet } from "@/middlewares/linesheet.middleware";
import { uploadCollectionImage } from "@/middlewares/collection.middleware";
import { uploadCategoryImage } from "@/middlewares/category.middleware";

const router: Router = Router();

router.get("/", getProductsController);
router.get("/collections", getCollectionsController);
router.post(
	"/collections",
	authenticate,
	authorize("ADMIN"),
	uploadCollectionImage.single("image"),
	createCollectionController,
);
router.patch(
	"/collections/:id",
	authenticate,
	authorize("ADMIN"),
	uploadCollectionImage.single("image"),
	updateCollectionController,
);
router.delete(
	"/collections/:id",
	authenticate,
	authorize("ADMIN"),
	deleteCollectionController,
);

router.get("/categories", getCategoriesController);
router.post(
	"/categories",
	authenticate,
	authorize("ADMIN"),
	uploadCategoryImage.single("image"),
	createCategoryController,
);
router.patch(
	"/categories/:id",
	authenticate,
	authorize("ADMIN"),
	uploadCategoryImage.single("image"),
	updateCategoryController,
);
router.delete(
	"/categories/:id",
	authenticate,
	authorize("ADMIN"),
	deleteCategoryController,
);
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
	uploadLinesheet.single("pdf"),
	updateLinesheetLinkController,
);
router.put(
	"/:id/collections",
	authenticate,
	authorize("ADMIN"),
	updateProductCollectionsController,
);
router.put(
	"/:id/categories",
	authenticate,
	authorize("ADMIN"),
	updateProductCategoriesController,
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
