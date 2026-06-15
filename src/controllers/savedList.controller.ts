import type { Request, Response } from "express";
import { createSavedListSchema } from "@/validations/savedList.validation";
import {
	createSavedList,
	getSavedLists,
	deleteSavedList,
} from "@/services/savedList.service";
import { sendResponse } from "@/helpers/sendResponse";
import { HttpError } from "@/helpers/errors";

export async function createSavedListController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const body = createSavedListSchema.parse(req.body);

	const list = await createSavedList(req.user.id, body.name, body.items);

	return sendResponse(res, 201, {
		success: true,
		message: "List saved successfully",
		data: list,
	});
}

export async function getSavedListsController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const lists = await getSavedLists(req.user.id);

	return sendResponse(res, 200, {
		success: true,
		message: "Saved lists fetched successfully",
		data: lists,
	});
}

export async function deleteSavedListController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params as { id: string };

	await deleteSavedList(req.user.id, id);

	return sendResponse(res, 200, {
		success: true,
		message: "Saved list deleted successfully",
	});
}
