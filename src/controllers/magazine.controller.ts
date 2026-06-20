import type { Request, Response } from "express";
import { prisma } from "../prisma/index";
import { HttpError } from "../helpers/errors";
import { sendResponse } from "../helpers/sendResponse";

export async function getMagazines(_req: Request, res: Response) {
	try {
		const magazines = await prisma.magazine.findMany({
			orderBy: { date: "desc" },
		});

		return sendResponse(res, 200, {
			success: true,
			data: magazines,
		});
	} catch (error) {
		console.error("Get Magazines Error:", error);
		throw HttpError.InternalServerError("Failed to fetch magazines");
	}
}

export async function createMagazine(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { link, date, issueNumber } = req.body;
	if (!link || !date) {
		throw HttpError.BadRequest("Link and date are required");
	}

	let imageUrl = null;
	if (req.file) {
		imageUrl = `/public/uploads/magazines/${req.file.filename}`;
	}

	try {
		const magazine = await prisma.magazine.create({
			data: {
				link,
				image: imageUrl,
				issueNumber: issueNumber || null,
				date: new Date(date),
			},
		});

		return sendResponse(res, 201, {
			success: true,
			data: magazine,
		});
	} catch (error) {
		console.error("Create Magazine Error:", error);
		throw HttpError.InternalServerError("Failed to create magazine");
	}
}

export async function updateMagazine(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;
	const { link, date, issueNumber } = req.body;

	if (!link || !date) {
		throw HttpError.BadRequest("Link and date are required");
	}

	const updateData: any = {
		link,
		date: new Date(date),
		issueNumber: issueNumber || null,
	};

	if (req.file) {
		updateData.image = `/public/uploads/magazines/${req.file.filename}`;
	}

	try {
		const magazine = await prisma.magazine.update({
			where: { id: id as string },
			data: updateData,
		});

		return sendResponse(res, 200, {
			success: true,
			data: magazine,
		});
	} catch (error) {
		console.error("Update Magazine Error:", error);
		throw HttpError.InternalServerError("Failed to update magazine");
	}
}

export async function deleteMagazine(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;

	try {
		await prisma.magazine.delete({
			where: { id: id as string },
		});

		return sendResponse(res, 200, {
			success: true,
			message: "Magazine deleted successfully",
		});
	} catch (error) {
		console.error("Delete Magazine Error:", error);
		throw HttpError.InternalServerError("Failed to delete magazine");
	}
}
