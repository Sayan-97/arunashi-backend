import { Router } from "express";
import {
	getGemstones,
	createGemstone,
	updateGemstone,
	deleteGemstone,
} from "../controllers/gemstone.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { uploadGemstone } from "../middlewares/gemstone.middleware";

const router: Router = Router();

router.get("/", getGemstones);
router.post("/", authenticate, uploadGemstone.single("pdf"), createGemstone);
router.put("/:id", authenticate, uploadGemstone.single("pdf"), updateGemstone);
router.delete("/:id", authenticate, deleteGemstone);

export default router;
