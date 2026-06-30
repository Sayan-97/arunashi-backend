import type { Request, Response } from "express";
import { prisma } from "../prisma/index";
import { HttpError } from "../helpers/errors";
import { sendResponse } from "../helpers/sendResponse";
import { DEFAULT_TERMS } from "../constants/defaultTerms";
import { realtimeService } from "../services/realtime.service";

export async function getTermsController(_req: Request, res: Response) {
	try {
		let terms = await prisma.termsAndConditions.findFirst();
		if (!terms) {
			terms = await prisma.termsAndConditions.create({
				data: {
					content: DEFAULT_TERMS,
				},
			});
		}

		return sendResponse(res, 200, {
			success: true,
			data: terms,
		});
	} catch (error) {
		console.error("Get Terms Error:", error);
		throw HttpError.InternalServerError("Failed to fetch terms and conditions");
	}
}

export async function updateTermsController(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { content } = req.body;
	if (content === undefined || content === null) {
		throw HttpError.BadRequest("Content is required");
	}

	try {
		let terms = await prisma.termsAndConditions.findFirst();
		if (!terms) {
			terms = await prisma.termsAndConditions.create({
				data: { content },
			});
		} else {
			terms = await prisma.termsAndConditions.update({
				where: { id: terms.id },
				data: { content },
			});
		}

		realtimeService.broadcast("terms:updated", terms);

		return sendResponse(res, 200, {
			success: true,
			data: terms,
			message: "Terms and conditions updated successfully",
		});
	} catch (error) {
		console.error("Update Terms Error:", error);
		throw HttpError.InternalServerError(
			"Failed to update terms and conditions",
		);
	}
}
