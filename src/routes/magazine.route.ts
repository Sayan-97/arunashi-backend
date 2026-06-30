import { Router } from "express";
import {
	getMagazines,
	createMagazine,
	deleteMagazine,
	updateMagazine,
} from "../controllers/magazine.controller";
import { authenticate } from "../middlewares/auth.middleware";

import { uploadMagazinePdf } from "../middlewares/magazine-pdf.middleware";

const router: Router = Router();

router.get("/", getMagazines);
router.post(
	"/",
	authenticate,
	uploadMagazinePdf.fields([
		{ name: "pdf", maxCount: 1 },
		{ name: "image", maxCount: 1 },
	]),
	createMagazine,
);
router.put(
	"/:id",
	authenticate,
	uploadMagazinePdf.fields([
		{ name: "pdf", maxCount: 1 },
		{ name: "image", maxCount: 1 },
	]),
	updateMagazine,
);
router.delete("/:id", authenticate, deleteMagazine);

export default router;
