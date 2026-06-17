import { env } from "@/configs/env";
import { HttpError } from "@/helpers/errors";
import { prisma } from "@/prisma";
import type { RequestStatus } from "@/generated/prisma/client";
import { sendProductRequestEmail } from "@/services/email.service";

export async function fetchShopifyProducts() {
	const domain = env.SHOPIFY_STORE_DOMAIN;
	const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;

	try {
		const response = await fetch(
			`https://${domain}/admin/api/2024-04/products.json?limit=250`,
			{
				headers: {
					"X-Shopify-Access-Token": token,
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				"Shopify Products Fetch Error Status:",
				response.status,
				errorText,
			);
			throw HttpError.InternalServerError(
				"Failed to fetch products from Shopify",
			);
		}

		const data = (await response.json()) as { products?: any[] };
		return data.products || [];
	} catch (error) {
		console.error("Shopify Products Fetch Error:", error);
		if (error instanceof HttpError) throw error;
		throw HttpError.InternalServerError("Failed to communicate with Shopify");
	}
}

export async function fetchShopifyCollections() {
	const domain = env.SHOPIFY_STORE_DOMAIN;
	const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;

	try {
		const response = await fetch(
			`https://${domain}/admin/api/2026-01/smart_collections.json`,
			{
				headers: {
					"X-Shopify-Access-Token": token,
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				"Shopify Collections Fetch Error Status:",
				response.status,
				errorText,
			);
			throw HttpError.InternalServerError(
				"Failed to fetch collections from Shopify",
			);
		}

		const data = (await response.json()) as { collections?: any[] };
		return data || [];
	} catch (error) {
		console.error("Shopify Collections Fetch Error:", error);
		if (error instanceof HttpError) throw error;
		throw HttpError.InternalServerError("Failed to communicate with Shopify");
	}
}

export async function submitProductRequest(userId: string, items: any) {
	const request = await prisma.productRequest.create({
		data: {
			userId,
			items,
			status: "PENDING",
		},
		include: {
			user: {
				select: {
					name: true,
					email: true,
					company: true,
				},
			},
		},
	});

	// Send email notification to admin asynchronously
	try {
		await sendProductRequestEmail(request);
	} catch (error) {
		console.error("Failed to send new product request email to admin:", error);
	}

	return request;
}

export async function getUserRequests(userId: string) {
	return prisma.productRequest.findMany({
		where: {
			userId,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

export async function getAllRequests() {
	return prisma.productRequest.findMany({
		orderBy: {
			createdAt: "desc",
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					company: true,
				},
			},
		},
	});
}

export async function updateRequestStatus(
	requestId: string,
	status: RequestStatus,
) {
	const existing = await prisma.productRequest.findUnique({
		where: {
			id: requestId,
		},
	});

	if (!existing) {
		throw HttpError.NotFound("Product request not found");
	}

	return prisma.productRequest.update({
		where: {
			id: requestId,
		},
		data: {
			status,
		},
	});
}

export async function getActiveProducts() {
	const activeRecords = await prisma.activeProduct.findMany({
		select: { id: true },
	});
	return activeRecords.map((r) => r.id);
}

export async function activateProduct(id: string) {
	return prisma.activeProduct.upsert({
		where: { id },
		update: {},
		create: { id },
	});
}

export async function deactivateProduct(id: string) {
	return prisma.activeProduct.deleteMany({
		where: { id },
	});
}
