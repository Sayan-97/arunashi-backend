import type { Request, Response } from "express";
import {
	fetchShopifyProducts,
	fetchShopifyCollections,
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

export async function getProductsController(_req: Request, res: Response) {
	const [products, productData] = await Promise.all([
		fetchShopifyProducts(),
		getAllProductData(),
	]);

	const dataMap = new Map(productData.map((d: any) => [d.id, d]));
	const filteredProducts = products
		.filter((p: any) => p.status === "active")
		.filter((p: any) => dataMap.get(String(p.id))?.isActive)
		.map((p: any) => ({
			...p,
			linesheetLink: dataMap.get(String(p.id))?.linesheetLink || null,
		}));

	return sendResponse(res, 200, {
		success: true,
		data: filteredProducts,
	});
}

export async function getCollectionsController(_req: Request, res: Response) {
	const collections = await fetchShopifyCollections();

	return sendResponse(res, 200, {
		success: true,
		data: collections,
	});
}

export async function getAdminProductsController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const [products, productData] = await Promise.all([
		fetchShopifyProducts(),
		getAllProductData(),
	]);

	const dataMap = new Map(productData.map((d: any) => [d.id, d]));
	const filteredProducts = products
		.filter((p: any) => p.status === "active")
		.map((p: any) => {
			const dbData = dataMap.get(String(p.id));
			return {
				...p,
				isActivated: dbData?.isActive ?? false,
				linesheetLink: dbData?.linesheetLink || null,
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
	const { link } = req.body as { link: string };

	if (!id) {
		throw HttpError.BadRequest("Product ID is required");
	}

	const record = await updateLinesheetLink(id, link || "");

	await prisma.auditLog.create({
		data: {
			action: `Updated linesheet link for product: ${id}`,
		},
	});

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

	return sendResponse(res, 200, {
		success: true,
		message: `Successfully synced ${result.synced} products to the database`,
		data: result,
	});
}
