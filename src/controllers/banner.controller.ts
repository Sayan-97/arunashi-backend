import type { Request, Response } from "express";
import { prisma } from "../prisma/index";
import { HttpError } from "../helpers/errors";
import { sendResponse } from "../helpers/sendResponse";
import fs from "node:fs";
import path from "node:path";
import { realtimeService } from "../services/realtime.service";

export async function getBanners(_req: Request, res: Response) {
	try {
		const banners = await prisma.banner.findMany({
			where: { isActive: true },
			orderBy: [{ order: "asc" }, { createdAt: "desc" }],
		});

		return sendResponse(res, 200, {
			success: true,
			data: banners,
		});
	} catch (error) {
		console.error("Get Active Banners Error:", error);
		throw HttpError.InternalServerError("Failed to fetch banners");
	}
}

export async function adminGetBanners(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	try {
		const banners = await prisma.banner.findMany({
			orderBy: [{ order: "asc" }, { createdAt: "desc" }],
		});

		return sendResponse(res, 200, {
			success: true,
			data: banners,
		});
	} catch (error) {
		console.error("Admin Get Banners Error:", error);
		throw HttpError.InternalServerError("Failed to fetch banners");
	}
}

export async function createBanner(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	if (!req.file) {
		throw HttpError.BadRequest("Image file is required");
	}

	const { link, isActive, order } = req.body;
	const imageUrl = `/public/uploads/banners/${req.file.filename}`;

	const parsedOrder = parseInt(String(order));
	const finalOrder = isNaN(parsedOrder) ? 0 : parsedOrder;

	try {
		const banner = await prisma.banner.create({
			data: {
				image: imageUrl,
				link: link || null,
				isActive: isActive !== undefined ? String(isActive) === "true" : true,
				order: finalOrder,
			},
		});

		realtimeService.broadcast("banners:updated", banner);

		return sendResponse(res, 201, {
			success: true,
			data: banner,
		});
	} catch (error) {
		console.error("Create Banner Error:", error);
		throw HttpError.InternalServerError("Failed to create banner");
	}
}

export async function updateBanner(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;
	const { link, isActive, order } = req.body;

	const updateData: any = {};
	if (link !== undefined) updateData.link = link || null;
	if (isActive !== undefined) updateData.isActive = String(isActive) === "true";
	if (order !== undefined) {
		const parsedOrder = parseInt(String(order));
		if (!isNaN(parsedOrder)) {
			updateData.order = parsedOrder;
		} else {
			updateData.order = 0;
		}
	}

	if (req.file) {
		updateData.image = `/public/uploads/banners/${req.file.filename}`;
	}

	try {
		const banner = await prisma.banner.update({
			where: { id: id as string },
			data: updateData,
		});

		realtimeService.broadcast("banners:updated", banner);

		return sendResponse(res, 200, {
			success: true,
			data: banner,
		});
	} catch (error) {
		console.error("Update Banner Error:", error);
		throw HttpError.InternalServerError("Failed to update banner");
	}
}

export async function toggleBannerStatus(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;

	try {
		const existingBanner = await prisma.banner.findUnique({
			where: { id: id as string },
		});

		if (!existingBanner) {
			throw HttpError.NotFound("Banner not found");
		}

		const banner = await prisma.banner.update({
			where: { id: id as string },
			data: {
				isActive: !existingBanner.isActive,
			},
		});

		realtimeService.broadcast("banners:updated", banner);

		return sendResponse(res, 200, {
			success: true,
			data: banner,
		});
	} catch (error) {
		console.error("Toggle Banner Status Error:", error);
		throw HttpError.InternalServerError("Failed to toggle banner status");
	}
}

export async function deleteBanner(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;

	try {
		const banner = await prisma.banner.findUnique({
			where: { id: id as string },
		});

		if (banner && banner.image) {
			const filename = path.basename(banner.image);
			const filePath = path.join(
				process.cwd(),
				"public",
				"uploads",
				"banners",
				filename,
			);
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
		}

		await prisma.banner.delete({
			where: { id: id as string },
		});

		realtimeService.broadcast("banners:updated", { id });

		return sendResponse(res, 200, {
			success: true,
			message: "Banner deleted successfully",
		});
	} catch (error) {
		console.error("Delete Banner Error:", error);
		throw HttpError.InternalServerError("Failed to delete banner");
	}
}
