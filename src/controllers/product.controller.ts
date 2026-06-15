import type { Request, Response } from "express";
import {
	fetchShopifyProducts,
	submitProductRequest,
	getUserRequests,
	getAllRequests,
	updateRequestStatus,
} from "@/services/product.service";
import {
	submitProductRequestSchema,
	updateRequestStatusSchema,
} from "@/validations/product.validation";
import { sendResponse } from "@/helpers/sendResponse";
import { HttpError } from "@/helpers/errors";

export async function getProductsController(_req: Request, res: Response) {
	const products = await fetchShopifyProducts();

	return sendResponse(res, 200, {
		success: true,
		data: products,
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

	return sendResponse(res, 200, {
		success: true,
		message: "Request status updated successfully",
		data: request,
	});
}
