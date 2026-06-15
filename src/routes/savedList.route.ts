import { Router } from "express";
import { authenticate } from "@/middlewares/auth.middleware";
import {
	createSavedListController,
	getSavedListsController,
	deleteSavedListController,
} from "@/controllers/savedList.controller";

const router: Router = Router();

router.use(authenticate);

router.post("/", createSavedListController);
router.get("/", getSavedListsController);
router.delete("/:id", deleteSavedListController);

export { router as SavedListRouter };
