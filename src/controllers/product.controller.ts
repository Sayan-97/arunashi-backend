import type { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import {
	fetchShopifyProducts,
	submitProductRequest,
	getUserRequests,
	getAllRequests,
	updateRequestStatus,
	activateProduct,
	deactivateProduct,
	getAllProductData,
	updateLinesheetLink,
	syncProductsFromShopify,
} from "@/services/product.service";
import {
	submitProductRequestSchema,
	updateRequestStatusSchema,
} from "@/validations/product.validation";
import { sendResponse } from "@/helpers/sendResponse";
import { HttpError } from "@/helpers/errors";
import { prisma } from "@/prisma";
import { realtimeService } from "@/services/realtime.service";
import { createNotification } from "@/services/notification.service";

export async function getProductsController(_req: Request, res: Response) {
	const [products, productData, productCollections, productCategories] = await Promise.all([
		fetchShopifyProducts(),
		getAllProductData(),
		prisma.productCollection.findMany({
			include: { collection: true },
		}),
		prisma.productCategory.findMany({
			include: { category: true },
		}),
	]);

	const dataMap = new Map(productData.map((d: any) => [d.id, d]));
	
	const productCollectionsMap = new Map<string, { id: string; title: string; handle: string }[]>();
	for (const pc of productCollections) {
		const list = productCollectionsMap.get(pc.productId) || [];
		list.push({
			id: pc.collection.id,
			title: pc.collection.name,
			handle: pc.collection.handle,
		});
		productCollectionsMap.set(pc.productId, list);
	}

	const productCategoriesMap = new Map<string, { id: string; title: string; handle: string }[]>();
	for (const pc of productCategories) {
		const list = productCategoriesMap.get(pc.productId) || [];
		list.push({
			id: pc.category.id,
			title: pc.category.name,
			handle: pc.category.handle,
		});
		productCategoriesMap.set(pc.productId, list);
	}

	const filteredProducts = products
		.filter((p: any) => {
			return dataMap.get(String(p.id))?.isActive ?? false;
		})
		.map((p: any) => {
			const dbData = dataMap.get(String(p.id));
			const localCols = productCollectionsMap.get(String(p.id)) || [];
			const localCats = productCategoriesMap.get(String(p.id)) || [];
			return {
				...p,
				gemstoneDetails: dbData?.gemstoneDetails || null,
				diamondShapeDetails: dbData?.diamondShapeDetails || null,
				certificates: dbData?.certificates || null,
				collections: localCols,
				categories: localCats,
			};
		});

	return sendResponse(res, 200, {
		success: true,
		data: filteredProducts,
	});
}

export async function getCollectionsController(_req: Request, res: Response) {
	const collections = await prisma.collection.findMany({
		orderBy: { name: "asc" },
		include: {
			products: {
				select: { productId: true },
			},
		},
	});

	// Format output to match ShopifyCollection interface (id, title, handle, description, image)
	const formatted = collections.map((c) => ({
		id: c.id,
		title: c.name,
		handle: c.handle,
		description: c.description,
		image: c.image ? { url: c.image } : null,
		productIds: c.products.map((p) => p.productId),
	}));

	return sendResponse(res, 200, {
		success: true,
		data: formatted,
	});
}

export async function createCollectionController(req: Request, res: Response) {
	if (!req.user || req.user.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { name, handle, description } = req.body;
	if (!name || !handle) {
		throw HttpError.BadRequest("Name and handle are required");
	}

	const nameStr = typeof name === "string" ? name : String(name);
	const handleStr = typeof handle === "string" ? handle : String(handle);
	const descStr = typeof description === "string" ? description : undefined;

	let imagePath: string | null = null;
	if (req.file) {
		imagePath = `/public/uploads/collections/${req.file.filename}`;
	}

	const collection = await prisma.collection.create({
		data: {
			name: nameStr,
			handle: handleStr,
			description: descStr || null,
			image: imagePath,
		},
	});

	// Handle linking productIds
	let productIds: string[] | undefined;
	if (req.body.productIds) {
		try {
			productIds = typeof req.body.productIds === "string"
				? JSON.parse(req.body.productIds)
				: req.body.productIds;
		} catch {
			if (typeof req.body.productIds === "string") {
				productIds = req.body.productIds.split(",").map((id: string) => id.trim()).filter(Boolean);
			}
		}
	}

	if (Array.isArray(productIds)) {
		for (const prodId of productIds) {
			const cleanProdId = typeof prodId === "string" ? prodId : String(prodId);
			await prisma.productData.upsert({
				where: { id: cleanProdId },
				update: {},
				create: { id: cleanProdId, isActive: true },
			});
			await prisma.productCollection.create({
				data: {
					productId: cleanProdId,
					collectionId: collection.id,
				},
			});
		}
	}

	return sendResponse(res, 201, {
		success: true,
		data: collection,
	});
}

export async function updateCollectionController(req: Request, res: Response) {
	if (!req.user || req.user.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;
	const idStr = typeof id === "string" ? id : String(id);
	const { name, handle, description } = req.body;

	const existing = await prisma.collection.findUnique({
		where: { id: idStr },
	});
	if (!existing) {
		throw HttpError.NotFound("Collection not found");
	}

	let imagePath = existing.image;
	if (req.file) {
		if (existing.image) {
			const oldPath = path.join(process.cwd(), existing.image);
			if (fs.existsSync(oldPath)) {
				fs.unlinkSync(oldPath);
			}
		}
		imagePath = `/public/uploads/collections/${req.file.filename}`;
	}

	const nameStr = typeof name === "string" ? name : undefined;
	const handleStr = typeof handle === "string" ? handle : undefined;
	const descStr = typeof description === "string" ? description : description === null ? null : undefined;

	const updated = await prisma.collection.update({
		where: { id: idStr },
		data: {
			name: nameStr ?? existing.name,
			handle: handleStr ?? existing.handle,
			description: descStr !== undefined ? descStr : existing.description,
			image: imagePath,
		},
	});

	// Handle linking productIds
	let productIds: string[] | undefined;
	if (req.body.productIds) {
		try {
			productIds = typeof req.body.productIds === "string"
				? JSON.parse(req.body.productIds)
				: req.body.productIds;
		} catch {
			if (typeof req.body.productIds === "string") {
				productIds = req.body.productIds.split(",").map((id: string) => id.trim()).filter(Boolean);
			}
		}
	}

	if (Array.isArray(productIds)) {
		await prisma.productCollection.deleteMany({
			where: { collectionId: idStr },
		});
		for (const prodId of productIds) {
			const cleanProdId = typeof prodId === "string" ? prodId : String(prodId);
			await prisma.productData.upsert({
				where: { id: cleanProdId },
				update: {},
				create: { id: cleanProdId, isActive: true },
			});
			await prisma.productCollection.create({
				data: {
					productId: cleanProdId,
					collectionId: idStr,
				},
			});
		}
	}

	return sendResponse(res, 200, {
		success: true,
		data: updated,
	});
}

export async function deleteCollectionController(req: Request, res: Response) {
	if (!req.user || req.user.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;
	const idStr = typeof id === "string" ? id : String(id);
	const existing = await prisma.collection.findUnique({
		where: { id: idStr },
	});
	if (!existing) {
		throw HttpError.NotFound("Collection not found");
	}

	if (existing.image) {
		const oldPath = path.join(process.cwd(), existing.image);
		if (fs.existsSync(oldPath)) {
			fs.unlinkSync(oldPath);
		}
	}

	await prisma.collection.delete({
		where: { id: idStr },
	});

	return sendResponse(res, 200, {
		success: true,
		message: "Collection deleted successfully",
	});
}

export async function getAdminProductsController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const [products, productData, productCollections, productCategories] = await Promise.all([
		fetchShopifyProducts(),
		getAllProductData(),
		prisma.productCollection.findMany({
			include: { collection: true },
		}),
		prisma.productCategory.findMany({
			include: { category: true },
		}),
	]);

	const dataMap = new Map(productData.map((d: any) => [d.id, d]));
	
	const productCollectionsMap = new Map<string, { id: string; title: string; handle: string }[]>();
	for (const pc of productCollections) {
		const list = productCollectionsMap.get(pc.productId) || [];
		list.push({
			id: pc.collection.id,
			title: pc.collection.name,
			handle: pc.collection.handle,
		});
		productCollectionsMap.set(pc.productId, list);
	}

	const productCategoriesMap = new Map<string, { id: string; title: string; handle: string }[]>();
	for (const pc of productCategories) {
		const list = productCategoriesMap.get(pc.productId) || [];
		list.push({
			id: pc.category.id,
			title: pc.category.name,
			handle: pc.category.handle,
		});
		productCategoriesMap.set(pc.productId, list);
	}

	const filteredProducts = products
		.filter((p: any) => p.status === "active")
		.map((p: any) => {
			const dbData = dataMap.get(String(p.id));
			const localCols = productCollectionsMap.get(String(p.id)) || [];
			const localCats = productCategoriesMap.get(String(p.id)) || [];
			return {
				...p,
				isActivated: dbData?.isActive ?? false,
				linesheetLink: dbData?.linesheetLink || null,
				gemstoneDetails: dbData?.gemstoneDetails || null,
				diamondShapeDetails: dbData?.diamondShapeDetails || null,
				certificates: dbData?.certificates || null,
				collections: localCols,
				categories: localCats,
			};
		});

	return sendResponse(res, 200, {
		success: true,
		data: filteredProducts,
	});
}

export async function activateProductController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params as { id: string };
	if (!id) {
		throw HttpError.BadRequest("Product ID is required");
	}

	const record = await activateProduct(id);

	// Log action
	await prisma.auditLog.create({
		data: {
			action: `Activated product: ${id}`,
		},
	});

	realtimeService.broadcast("products:updated", record);

	return sendResponse(res, 200, {
		success: true,
		message: "Product activated successfully",
		data: record,
	});
}

export async function deactivateProductController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params as { id: string };
	if (!id) {
		throw HttpError.BadRequest("Product ID is required");
	}

	await deactivateProduct(id);

	// Log action
	await prisma.auditLog.create({
		data: {
			action: `Deactivated product: ${id}`,
		},
	});

	realtimeService.broadcast("products:updated", { id });

	return sendResponse(res, 200, {
		success: true,
		message: "Product deactivated successfully",
	});
}

export async function submitProductRequestController(
	req: Request,
	res: Response,
) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const body = submitProductRequestSchema.parse(req.body);

	const request = await submitProductRequest(req.user.id, body.items);

	const userRecord = await prisma.user.findUnique({
		where: { id: req.user.id },
	});

	// Create and save database notification (which also broadcasts to clients via SSE)
	await createNotification(
		"product_request",
		"New Product Request",
		`Product linesheet request submitted by ${userRecord?.company || userRecord?.name || "a retailer"}.`,
		"/requests/pending-requests",
	);

	realtimeService.broadcast("requests:submitted", request);

	return sendResponse(res, 201, {
		success: true,
		message: "Request submitted successfully",
		data: request,
	});
}

export async function getUserRequestsController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const requests = await getUserRequests(req.user.id);

	return sendResponse(res, 200, {
		success: true,
		message: "Requests fetched successfully",
		data: requests,
	});
}

export async function getAllRequestsController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const requests = await getAllRequests();

	return sendResponse(res, 200, {
		success: true,
		message: "All requests fetched successfully",
		data: requests,
	});
}

export async function updateRequestStatusController(
	req: Request,
	res: Response,
) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params as { id: string };
	const body = updateRequestStatusSchema.parse(req.body);

	const request = await updateRequestStatus(id, body.status);

	// Log action
	await prisma.auditLog.create({
		data: {
			action: `Updated request status to ${body.status} (ID: ${id})`,
		},
	});

	realtimeService.broadcast("requests:updated", request);

	return sendResponse(res, 200, {
		success: true,
		message: "Request status updated successfully",
		data: request,
	});
}

export async function updateLinesheetLinkController(
	req: Request,
	res: Response,
) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params as { id: string };

	if (!id) {
		throw HttpError.BadRequest("Product ID is required");
	}

	const currentData = await prisma.productData.findUnique({
		where: { id },
	});

	let link = currentData?.linesheetLink || null;

	if (req.file) {
		link = `/public/uploads/linesheets/${req.file.filename}`;

		if (currentData?.linesheetLink) {
			const oldPath = path.join(process.cwd(), currentData.linesheetLink);
			if (fs.existsSync(oldPath)) {
				try {
					fs.unlinkSync(oldPath);
				} catch (err) {
					console.error(`Failed to delete old linesheet file: ${oldPath}`, err);
				}
			}
		}
	} else if (req.body.deleteFile === "true" || req.body.link === "") {
		link = null;
		if (currentData?.linesheetLink) {
			const oldPath = path.join(process.cwd(), currentData.linesheetLink);
			if (fs.existsSync(oldPath)) {
				try {
					fs.unlinkSync(oldPath);
				} catch (err) {
					console.error(`Failed to delete linesheet file: ${oldPath}`, err);
				}
			}
		}
	}

	const record = await updateLinesheetLink(id, link);

	await prisma.auditLog.create({
		data: {
			action: `Updated linesheet link for product: ${id}`,
		},
	});

	realtimeService.broadcast("products:updated", record);

	return sendResponse(res, 200, {
		success: true,
		message: "Linesheet link updated successfully",
		data: record,
	});
}

export async function syncProductsController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const result = await syncProductsFromShopify();

	await prisma.auditLog.create({
		data: {
			action: `Synced ${result.synced} active products from Shopify`,
		},
	});

	realtimeService.broadcast("products:updated", result);

	return sendResponse(res, 200, {
		success: true,
		message: `Successfully synced ${result.synced} products to the database`,
		data: result,
	});
}

export async function updateProductCollectionsController(req: Request, res: Response) {
	if (!req.user || req.user.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;
	const { collectionIds } = req.body; // array of Collection UUIDs

	const cleanProductId = typeof id === "string" ? id : String(id);

	// Clear existing collection links for this product
	await prisma.productCollection.deleteMany({
		where: { productId: cleanProductId },
	});

	// Link to new collections
	if (Array.isArray(collectionIds)) {
		// Ensure product data exists
		await prisma.productData.upsert({
			where: { id: cleanProductId },
			update: {},
			create: { id: cleanProductId, isActive: true },
		});

		for (const colId of collectionIds) {
			const cleanColId = typeof colId === "string" ? colId : String(colId);
			await prisma.productCollection.create({
				data: {
					productId: cleanProductId,
					collectionId: cleanColId,
				},
			});
		}
	}

	return sendResponse(res, 200, {
		success: true,
		message: "Product collections updated successfully",
	});
}

export async function getCategoriesController(_req: Request, res: Response) {
	const categories = await prisma.category.findMany({
		orderBy: { name: "asc" },
		include: {
			products: {
				select: { productId: true },
			},
		},
	});

	const formatted = categories.map((c) => ({
		id: c.id,
		title: c.name,
		handle: c.handle,
		description: c.description,
		image: c.image ? { url: c.image } : null,
		productIds: c.products.map((p) => p.productId),
	}));

	return sendResponse(res, 200, {
		success: true,
		data: formatted,
	});
}

export async function createCategoryController(req: Request, res: Response) {
	if (!req.user || req.user.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { name, handle, description } = req.body;
	if (!name || !handle) {
		throw HttpError.BadRequest("Name and handle are required");
	}

	const nameStr = typeof name === "string" ? name : String(name);
	const handleStr = typeof handle === "string" ? handle : String(handle);
	const descStr = typeof description === "string" ? description : undefined;

	let imagePath: string | null = null;
	if (req.file) {
		imagePath = `/public/uploads/categories/${req.file.filename}`;
	}

	const category = await prisma.category.create({
		data: {
			name: nameStr,
			handle: handleStr,
			description: descStr || null,
			image: imagePath,
		},
	});

	// Handle linking productIds
	let productIds: string[] | undefined;
	if (req.body.productIds) {
		try {
			productIds = typeof req.body.productIds === "string"
				? JSON.parse(req.body.productIds)
				: req.body.productIds;
		} catch {
			if (typeof req.body.productIds === "string") {
				productIds = req.body.productIds.split(",").map((id: string) => id.trim()).filter(Boolean);
			}
		}
	}

	if (Array.isArray(productIds)) {
		for (const prodId of productIds) {
			const cleanProdId = typeof prodId === "string" ? prodId : String(prodId);
			await prisma.productData.upsert({
				where: { id: cleanProdId },
				update: {},
				create: { id: cleanProdId, isActive: true },
			});
			await prisma.productCategory.create({
				data: {
					productId: cleanProdId,
					categoryId: category.id,
				},
			});
		}
	}

	return sendResponse(res, 201, {
		success: true,
		data: category,
	});
}

export async function updateCategoryController(req: Request, res: Response) {
	if (!req.user || req.user.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;
	const idStr = typeof id === "string" ? id : String(id);
	const { name, handle, description } = req.body;

	const existing = await prisma.category.findUnique({
		where: { id: idStr },
	});
	if (!existing) {
		throw HttpError.NotFound("Category not found");
	}

	let imagePath = existing.image;
	if (req.file) {
		if (existing.image) {
			const oldPath = path.join(process.cwd(), existing.image);
			if (fs.existsSync(oldPath)) {
				try {
					fs.unlinkSync(oldPath);
				} catch (err) {
					console.error(`Failed to delete old category image: ${oldPath}`, err);
				}
			}
		}
		imagePath = `/public/uploads/categories/${req.file.filename}`;
	}

	const nameStr = typeof name === "string" ? name : undefined;
	const handleStr = typeof handle === "string" ? handle : undefined;
	const descStr = typeof description === "string" ? description : description === null ? null : undefined;

	const updated = await prisma.category.update({
		where: { id: idStr },
		data: {
			name: nameStr ?? existing.name,
			handle: handleStr ?? existing.handle,
			description: descStr !== undefined ? descStr : existing.description,
			image: imagePath,
		},
	});

	// Handle linking productIds
	let productIds: string[] | undefined;
	if (req.body.productIds) {
		try {
			productIds = typeof req.body.productIds === "string"
				? JSON.parse(req.body.productIds)
				: req.body.productIds;
		} catch {
			if (typeof req.body.productIds === "string") {
				productIds = req.body.productIds.split(",").map((id: string) => id.trim()).filter(Boolean);
			}
		}
	}

	if (Array.isArray(productIds)) {
		await prisma.productCategory.deleteMany({
			where: { categoryId: idStr },
		});
		for (const prodId of productIds) {
			const cleanProdId = typeof prodId === "string" ? prodId : String(prodId);
			await prisma.productData.upsert({
				where: { id: cleanProdId },
				update: {},
				create: { id: cleanProdId, isActive: true },
			});
			await prisma.productCategory.create({
				data: {
					productId: cleanProdId,
					categoryId: idStr,
				},
			});
		}
	}

	return sendResponse(res, 200, {
		success: true,
		data: updated,
	});
}

export async function deleteCategoryController(req: Request, res: Response) {
	if (!req.user || req.user.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;
	const idStr = typeof id === "string" ? id : String(id);
	const existing = await prisma.category.findUnique({
		where: { id: idStr },
	});
	if (!existing) {
		throw HttpError.NotFound("Category not found");
	}

	if (existing.image) {
		const oldPath = path.join(process.cwd(), existing.image);
		if (fs.existsSync(oldPath)) {
			try {
				fs.unlinkSync(oldPath);
			} catch (err) {
				console.error(`Failed to delete category image: ${oldPath}`, err);
			}
		}
	}

	await prisma.category.delete({
		where: { id: idStr },
	});

	return sendResponse(res, 200, {
		success: true,
		message: "Category deleted successfully",
	});
}

export async function updateProductCategoriesController(req: Request, res: Response) {
	if (!req.user || req.user.role !== "ADMIN") {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params;
	const { categoryIds } = req.body; // array of Category UUIDs

	const cleanProductId = typeof id === "string" ? id : String(id);

	// Clear existing category links for this product
	await prisma.productCategory.deleteMany({
		where: { productId: cleanProductId },
	});

	// Link to new categories
	if (Array.isArray(categoryIds)) {
		// Ensure product data exists
		await prisma.productData.upsert({
			where: { id: cleanProductId },
			update: {},
			create: { id: cleanProductId, isActive: true },
		});

		for (const catId of categoryIds) {
			const cleanCatId = typeof catId === "string" ? catId : String(catId);
			await prisma.productCategory.create({
				data: {
					productId: cleanProductId,
					categoryId: cleanCatId,
				},
			});
		}
	}

	return sendResponse(res, 200, {
		success: true,
		message: "Product categories updated successfully",
	});
}
