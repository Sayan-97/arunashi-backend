import { Router } from "express";
import {
	getDiamonds,
	createDiamond,
	updateDiamond,
	deleteDiamond,
} from "../controllers/diamond.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { uploadShape } from "../middlewares/shape.middleware";

const router: Router = Router();

router.get("/", getDiamonds);
router.post("/", authenticate, uploadShape.single("pdf"), createDiamond);
router.put("/:id", authenticate, uploadShape.single("pdf"), updateDiamond);
router.delete("/:id", authenticate, deleteDiamond);

export default router;
