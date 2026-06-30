import type { Request, Response } from "express";
import { prisma } from "../prisma/index";
import { HttpError } from "../helpers/errors";
import { sendResponse } from "../helpers/sendResponse";
import { realtimeService } from "../services/realtime.service";
import fs from "fs";
import path from "path";

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

	let name = req.body.name;

	if (!req.file) {
		throw HttpError.BadRequest("PDF file is required");
	}

	const link = `/public/uploads/gemstones/${req.file.filename}`;

	if (!name) {
		name = req.file.filename
			.replace(/\.pdf$/i, "")
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	}

	try {
		const gemstone = await prisma.gemstone.create({
			data: {
				name,
				link,
			},
		});

		realtimeService.broadcast("gemstones:updated", gemstone);

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
	const { name } = req.body;

	if (!name) {
		throw HttpError.BadRequest("Name is required");
	}

	try {
		const existingGemstone = await prisma.gemstone.findUnique({
			where: { id: id as string },
		});

		if (!existingGemstone) {
			throw HttpError.NotFound("Gemstone not found");
		}

		let link = existingGemstone.link;

		if (req.file) {
			link = `/public/uploads/gemstones/${req.file.filename}`;

			// Delete old file if it exists and is different
			if (existingGemstone.link && existingGemstone.link !== link) {
				const oldFilename = existingGemstone.link.split("/").pop();
				if (oldFilename) {
					const oldFilePath = path.join(
						__dirname,
						"../../../public/uploads/gemstones",
						oldFilename,
					);
					if (fs.existsSync(oldFilePath)) {
						fs.unlinkSync(oldFilePath);
					}
				}
			}
		}

		const gemstone = await prisma.gemstone.update({
			where: { id: id as string },
			data: {
				name,
				link,
			},
		});

		realtimeService.broadcast("gemstones:updated", gemstone);

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
		const existingGemstone = await prisma.gemstone.findUnique({
			where: { id: id as string },
		});

		if (existingGemstone && existingGemstone.link) {
			const filename = existingGemstone.link.split("/").pop();
			if (filename) {
				const filePath = path.join(
					__dirname,
					"../../../public/uploads/gemstones",
					filename,
				);
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			}
		}

		await prisma.gemstone.delete({
			where: { id: id as string },
		});

		realtimeService.broadcast("gemstones:updated", { id });

		return sendResponse(res, 200, {
			success: true,
			message: "Gemstone deleted successfully",
		});
	} catch (error) {
		console.error("Delete Gemstone Error:", error);
		throw HttpError.InternalServerError("Failed to delete gemstone");
	}
}
