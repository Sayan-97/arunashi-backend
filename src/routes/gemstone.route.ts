import { Router } from "express";
import {
	getGemstones,
	createGemstone,
	updateGemstone,
	deleteGemstone,
} from "../controllers/gemstone.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router: Router = Router();

router.get("/", getGemstones);
router.post("/", authenticate, createGemstone);
router.put("/:id", authenticate, updateGemstone);
router.delete("/:id", authenticate, deleteGemstone);

export default router;
