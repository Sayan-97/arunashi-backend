import type { Request, Response } from "express";
import { prisma } from "../prisma/index";
import { HttpError } from "../helpers/errors";
import { sendResponse } from "../helpers/sendResponse";
import { realtimeService } from "../services/realtime.service";

export async function getDiamonds(_req: Request, res: Response) {
	try {
		const diamonds = await prisma.diamond.findMany({
			orderBy: { name: "asc" },
		});

		return sendResponse(res, 200, {
			success: true,
			data: diamonds,
		});
	} catch (error) {
		console.error("Get Diamonds Error:", error);
		throw HttpError.InternalServerError("Failed to fetch diamonds");
	}
}

export async function createDiamond(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { name, link } = req.body;
	if (!name || !link) {
		throw HttpError.BadRequest("Name and link are required");
	}

	try {
		const diamond = await prisma.diamond.create({
			data: {
				name,
				link,
			},
		});

		realtimeService.broadcast("diamonds:updated", diamond);

		return sendResponse(res, 201, {
			success: true,
			data: diamond,
		});
	} catch (error) {
		console.error("Create Diamond Error:", error);
		throw HttpError.InternalServerError("Failed to create diamond");
	}
}

export async function updateDiamond(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;
	const { name, link } = req.body;

	if (!name || !link) {
		throw HttpError.BadRequest("Name and link are required");
	}

	try {
		const diamond = await prisma.diamond.update({
			where: { id: id as string },
			data: {
				name,
				link,
			},
		});

		realtimeService.broadcast("diamonds:updated", diamond);

		return sendResponse(res, 200, {
			success: true,
			data: diamond,
		});
	} catch (error) {
		console.error("Update Diamond Error:", error);
		throw HttpError.InternalServerError("Failed to update diamond");
	}
}

export async function deleteDiamond(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;

	try {
		await prisma.diamond.delete({
			where: { id: id as string },
		});

		realtimeService.broadcast("diamonds:updated", { id });

		return sendResponse(res, 200, {
			success: true,
			message: "Diamond deleted successfully",
		});
	} catch (error) {
		console.error("Delete Diamond Error:", error);
		throw HttpError.InternalServerError("Failed to delete diamond");
	}
}
