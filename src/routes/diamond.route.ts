import { Router } from "express";
import {
	getDiamonds,
	createDiamond,
	updateDiamond,
	deleteDiamond,
} from "../controllers/diamond.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router: Router = Router();

router.get("/", getDiamonds);
router.post("/", authenticate, createDiamond);
router.put("/:id", authenticate, updateDiamond);
router.delete("/:id", authenticate, deleteDiamond);

export default router;
