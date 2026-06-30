import type { Request, Response } from "express";
import { prisma } from "../prisma/index";
import { HttpError } from "../helpers/errors";
import { sendResponse } from "../helpers/sendResponse";
import { DEFAULT_ABOUT } from "../constants/defaultAbout";
import { realtimeService } from "../services/realtime.service";

export async function getAboutController(_req: Request, res: Response) {
	try {
		let about = await prisma.aboutUs.findFirst();
		if (!about) {
			about = await prisma.aboutUs.create({
				data: {
					content: DEFAULT_ABOUT,
				},
			});
		}

		return sendResponse(res, 200, {
			success: true,
			data: about,
		});
	} catch (error) {
		console.error("Get About Error:", error);
		throw HttpError.InternalServerError("Failed to fetch about us details");
	}
}

export async function updateAboutController(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { content } = req.body;
	if (content === undefined || content === null) {
		throw HttpError.BadRequest("Content is required");
	}

	try {
		let about = await prisma.aboutUs.findFirst();
		if (!about) {
			about = await prisma.aboutUs.create({
				data: { content },
			});
		} else {
			about = await prisma.aboutUs.update({
				where: { id: about.id },
				data: { content },
			});
		}

		realtimeService.broadcast("about:updated", about);

		return sendResponse(res, 200, {
			success: true,
			data: about,
			message: "About us details updated successfully",
		});
	} catch (error) {
		console.error("Update About Error:", error);
		throw HttpError.InternalServerError("Failed to update about us details");
	}
}
