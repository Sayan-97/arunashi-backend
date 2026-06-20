import type { Request, Response } from "express";
import { prisma } from "../prisma/index";
import { HttpError } from "../helpers/errors";
import { sendResponse } from "../helpers/sendResponse";

export async function getGemstones(_req: Request, res: Response) {
	try {
		const gemstones = await prisma.gemstone.findMany({
			orderBy: { name: "asc" },
		});

		return sendResponse(res, 200, {
			success: true,
			data: gemstones,
		});
	} catch (error) {
		console.error("Get Gemstones Error:", error);
		throw HttpError.InternalServerError("Failed to fetch gemstones");
	}
}

export async function createGemstone(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { name, link } = req.body;
	if (!name || !link) {
		throw HttpError.BadRequest("Name and link are required");
	}

	try {
		const gemstone = await prisma.gemstone.create({
			data: {
				name,
				link,
			},
		});

		return sendResponse(res, 201, {
			success: true,
			data: gemstone,
		});
	} catch (error) {
		console.error("Create Gemstone Error:", error);
		throw HttpError.InternalServerError("Failed to create gemstone");
	}
}

export async function updateGemstone(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;
	const { name, link } = req.body;

	if (!name || !link) {
		throw HttpError.BadRequest("Name and link are required");
	}

	try {
		const gemstone = await prisma.gemstone.update({
			where: { id: id as string },
			data: {
				name,
				link,
			},
		});

		return sendResponse(res, 200, {
			success: true,
			data: gemstone,
		});
	} catch (error) {
		console.error("Update Gemstone Error:", error);
		throw HttpError.InternalServerError("Failed to update gemstone");
	}
}

export async function deleteGemstone(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;

	try {
		await prisma.gemstone.delete({
			where: { id: id as string },
		});

		return sendResponse(res, 200, {
			success: true,
			message: "Gemstone deleted successfully",
		});
	} catch (error) {
		console.error("Delete Gemstone Error:", error);
		throw HttpError.InternalServerError("Failed to delete gemstone");
	}
}
