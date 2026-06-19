import { Router } from "express";
import {
	getMagazines,
	createMagazine,
	deleteMagazine,
	updateMagazine,
} from "../controllers/magazine.controller";
import { authenticate } from "../middlewares/auth.middleware";

import { upload } from "../middlewares/upload.middleware";

const router: Router = Router();

router.get("/", getMagazines);
router.post("/", authenticate, upload.single("image"), createMagazine);
router.put("/:id", authenticate, upload.single("image"), updateMagazine);
router.delete("/:id", authenticate, deleteMagazine);

export default router;
