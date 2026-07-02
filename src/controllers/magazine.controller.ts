import type { Request, Response } from "express";
import { prisma } from "../prisma/index";
import { HttpError } from "../helpers/errors";
import { sendResponse } from "../helpers/sendResponse";
import { realtimeService } from "../services/realtime.service";
import fs from "node:fs";
import path from "node:path";
import { pdfToPng } from "pdf-to-png-converter";

// Helper to generate cover image from a PDF file path
async function generateCoverFromPdf(pdfFilePath: string): Promise<string> {
	const pngPages = await pdfToPng(pdfFilePath, {
		pagesToProcess: [1],
		viewportScale: 2.0,
	});

	if (!pngPages || pngPages.length === 0) {
		throw new Error("Failed to render PDF page");
	}

	const firstPage = pngPages[0];
	if (!firstPage.content) {
		throw new Error("Failed to render PDF page content");
	}
	const baseName = path.basename(pdfFilePath, ".pdf");
	const coverFilename = `${Date.now()}-${baseName}-cover.png`;
	const coverFilePath = path.join(
		process.cwd(),
		"public",
		"uploads",
		"magazine-pdfs",
		coverFilename,
	);

	fs.writeFileSync(coverFilePath, firstPage.content);

	return `/public/uploads/magazine-pdfs/${coverFilename}`;
}

// Helper to safely delete local files
function deleteLocalFile(filePath: string | null | undefined) {
	if (!filePath) return;
	const fullPath = path.join(process.cwd(), filePath);
	if (fs.existsSync(fullPath)) {
		try {
			fs.unlinkSync(fullPath);
		} catch (err) {
			console.error(`Failed to delete local file: ${fullPath}`, err);
		}
	}
}

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

	const { date, issueNumber, link: bodyLink } = req.body;
	if (!date) {
		throw HttpError.BadRequest("Date is required");
	}

	const files = req.files as
		| { [fieldname: string]: Express.Multer.File[] }
		| undefined;
	const pdfFile = files?.pdf?.[0];
	const imageFile = files?.image?.[0];

	if (!pdfFile && !bodyLink) {
		throw HttpError.BadRequest("Either a PDF file or a Canva link is required");
	}

	let linkUrl = bodyLink || "";
	let imageUrl = null;

	try {
		if (pdfFile) {
			linkUrl = `/public/uploads/magazine-pdfs/${pdfFile.filename}`;
			if (imageFile) {
				imageUrl = `/public/uploads/magazine-pdfs/${imageFile.filename}`;
			} else {
				imageUrl = await generateCoverFromPdf(pdfFile.path);
			}
		} else if (imageFile) {
			imageUrl = `/public/uploads/magazine-pdfs/${imageFile.filename}`;
		}

		const magazine = await prisma.magazine.create({
			data: {
				link: linkUrl,
				image: imageUrl,
				issueNumber: issueNumber || null,
				date: new Date(date),
			},
		});

		realtimeService.broadcast("magazines:updated", magazine);

		return sendResponse(res, 201, {
			success: true,
			data: magazine,
		});
	} catch (error) {
		console.error("Create Magazine Error:", error);
		if (pdfFile) {
			deleteLocalFile(`/public/uploads/magazine-pdfs/${pdfFile.filename}`);
		}
		if (imageFile) {
			deleteLocalFile(`/public/uploads/magazine-pdfs/${imageFile.filename}`);
		}
		if (imageUrl && imageUrl.startsWith("/public/uploads/magazine-pdfs/")) {
			deleteLocalFile(imageUrl);
		}
		throw HttpError.InternalServerError("Failed to create magazine");
	}
}

export async function updateMagazine(req: Request, res: Response) {
	if (req.user?.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;
	const { date, issueNumber, link: bodyLink } = req.body;

	if (!date) {
		throw HttpError.BadRequest("Date is required");
	}

	const existing = await prisma.magazine.findUnique({
		where: { id: id as string },
	});

	if (!existing) {
		throw HttpError.NotFound("Magazine not found");
	}

	const files = req.files as
		| { [fieldname: string]: Express.Multer.File[] }
		| undefined;
	const pdfFile = files?.pdf?.[0];
	const imageFile = files?.image?.[0];

	let linkUrl = existing.link;
	let imageUrl = existing.image;

	try {
		if (pdfFile) {
			if (existing.link.startsWith("/public/uploads/magazine-pdfs/")) {
				deleteLocalFile(existing.link);
			}
			linkUrl = `/public/uploads/magazine-pdfs/${pdfFile.filename}`;

			if (imageFile) {
				deleteLocalFile(existing.image);
				imageUrl = `/public/uploads/magazine-pdfs/${imageFile.filename}`;
			} else {
				deleteLocalFile(existing.image);
				imageUrl = await generateCoverFromPdf(pdfFile.path);
			}
		} else {
			if (bodyLink !== undefined) {
				linkUrl = bodyLink;
			}
			if (imageFile) {
				deleteLocalFile(existing.image);
				imageUrl = `/public/uploads/magazine-pdfs/${imageFile.filename}`;
			}
		}

		const magazine = await prisma.magazine.update({
			where: { id: id as string },
			data: {
				link: linkUrl,
				image: imageUrl,
				issueNumber: issueNumber || null,
				date: new Date(date),
			},
		});

		realtimeService.broadcast("magazines:updated", magazine);

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
		const existing = await prisma.magazine.findUnique({
			where: { id: id as string },
		});

		if (existing) {
			if (existing.link.startsWith("/public/uploads/magazine-pdfs/")) {
				deleteLocalFile(existing.link);
			}
			if (existing.image?.startsWith("/public/uploads/magazine-pdfs/")) {
				deleteLocalFile(existing.image);
			}
		}

		await prisma.magazine.delete({
			where: { id: id as string },
		});

		realtimeService.broadcast("magazines:updated", { id });

		return sendResponse(res, 200, {
			success: true,
			message: "Magazine deleted successfully",
		});
	} catch (error) {
		console.error("Delete Magazine Error:", error);
		throw HttpError.InternalServerError("Failed to delete magazine");
	}
}
