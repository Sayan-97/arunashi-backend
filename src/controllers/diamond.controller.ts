import type { Request, Response } from "express";
import { prisma } from "../prisma/index";
import { HttpError } from "../helpers/errors";
import { sendResponse } from "../helpers/sendResponse";
import { realtimeService } from "../services/realtime.service";
import fs from "node:fs";
import path from "node:path";

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

	if (!req.file) {
		throw HttpError.BadRequest("PDF file is required");
	}

	let { name } = req.body;
	const link = `/public/uploads/shapes/${req.file.filename}`;

	// If name is not provided, derive it from the PDF filename
	if (!name || name.trim() === "") {
		const rawName = req.file.filename
			.replace(/^diamond\s+/i, "")
			.replace(/\.pdf$/i, "")
			.trim();

		name = rawName
			.split(/\s+/)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
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
	let { name } = req.body;

	try {
		const existing = await prisma.diamond.findUnique({
			where: { id: id as string },
		});

		if (!existing) {
			throw HttpError.NotFound("Diamond shape not found");
		}

		let link = existing.link;

		if (req.file) {
			// Delete the old file if it was locally hosted
			if (existing.link?.startsWith("/public/uploads/")) {
				const oldFilename = path.basename(existing.link);
				const oldFilePath = path.join(
					process.cwd(),
					"public",
					"uploads",
					"shapes",
					oldFilename,
				);
				if (fs.existsSync(oldFilePath)) {
					fs.unlinkSync(oldFilePath);
				}
			}

			link = `/public/uploads/shapes/${req.file.filename}`;

			// If name is not provided, derive from the new filename
			if (!name || name.trim() === "") {
				const rawName = req.file.filename
					.replace(/^diamond\s+/i, "")
					.replace(/\.pdf$/i, "")
					.trim();

				name = rawName
					.split(/\s+/)
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(" ");
			}
		}

		// Ensure we have a valid name to update
		if (!name || name.trim() === "") {
			name = existing.name;
		}

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
		const diamond = await prisma.diamond.findUnique({
			where: { id: id as string },
		});

		if (diamond?.link?.startsWith("/public/uploads/")) {
			const filename = path.basename(diamond.link);
			const filePath = path.join(
				process.cwd(),
				"public",
				"uploads",
				"shapes",
				filename,
			);
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
		}

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
