import { Router } from "express";
import {
	getBanners,
	adminGetBanners,
	createBanner,
	updateBanner,
	deleteBanner,
	toggleBannerStatus,
} from "../controllers/banner.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/banner.middleware";

const router: Router = Router();

// Public route to fetch only active banners
router.get("/", getBanners);

// Admin routes
router.get("/admin", authenticate, adminGetBanners);
router.post("/", authenticate, upload.single("image"), createBanner);
router.put("/:id", authenticate, upload.single("image"), updateBanner);
router.patch("/:id/toggle", authenticate, toggleBannerStatus);
router.delete("/:id", authenticate, deleteBanner);

export default router;
