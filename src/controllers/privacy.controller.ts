import type { Request, Response } from "express";
import { prisma } from "../prisma/index";
import { HttpError } from "../helpers/errors";
import { sendResponse } from "../helpers/sendResponse";
import { DEFAULT_PRIVACY } from "../constants/defaultPrivacy";
import { realtimeService } from "../services/realtime.service";

export async function getPrivacyController(_req: Request, res: Response) {
	try {
		let privacy = await prisma.privacyPolicy.findFirst();
		if (!privacy) {
			privacy = await prisma.privacyPolicy.create({
				data: {
					content: DEFAULT_PRIVACY,
				},
			});
		}

		return sendResponse(res, 200, {
			success: true,
			data: privacy,
		});
	} catch (error) {
		console.error("Get Privacy Error:", error);
		throw HttpError.InternalServerError("Failed to fetch privacy policy");
	}
}

export async function updatePrivacyController(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { content } = req.body;
	if (content === undefined || content === null) {
		throw HttpError.BadRequest("Content is required");
	}

	try {
		let privacy = await prisma.privacyPolicy.findFirst();
		if (!privacy) {
			privacy = await prisma.privacyPolicy.create({
				data: { content },
			});
		} else {
			privacy = await prisma.privacyPolicy.update({
				where: { id: privacy.id },
				data: { content },
			});
		}

		realtimeService.broadcast("privacy:updated", privacy);

		return sendResponse(res, 200, {
			success: true,
			data: privacy,
			message: "Privacy policy updated successfully",
		});
	} catch (error) {
		console.error("Update Privacy Error:", error);
		throw HttpError.InternalServerError("Failed to update privacy policy");
	}
}
