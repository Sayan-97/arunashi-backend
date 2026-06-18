import { env } from "@/configs/env";
import { HttpError } from "@/helpers/errors";
import { prisma } from "@/prisma";
import type { RequestStatus } from "@/generated/prisma/client";
import { sendProductRequestEmail } from "@/services/email.service";

export async function fetchShopifyProducts() {
	const domain = env.SHOPIFY_STORE_DOMAIN;
	const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;

	const query = `
		query GetProducts {
    products(first: 250) {
        edges {
            node {
                id
                title
                handle
                descriptionHtml
                vendor
                productType
                tags
                status
                createdAt
                options {
                    id
                    name
                    values
                }
                # REMOVE featuredImage and ADD media query below:
                media(first: 20) {
                    edges {
                        node {
                            mediaContentType
                            ... on MediaImage {
                                image {
                                    url
                                }
                            }
                            ... on Video {
                                sources {
                                    url
                                    mimeType
                                }
                            }
                        }
                    }
                }
                variants(first: 100) {
                    edges {
                        node {
                            id
                            title
                            price
                            sku
                            inventoryQuantity
                            inventoryItem {
                                measurement {
                                    weight {
                                        value
                                        unit
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
	`;

	try {
		const response = await fetch(
			`https://${domain}/admin/api/2026-01/graphql.json`,
			{
				method: "POST",
				headers: {
					"X-Shopify-Access-Token": token,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ query }),
			},
		);

		const data = (await response.json()) as any;

		if (data.errors) {
			console.error(data.errors);
			throw HttpError.InternalServerError(
				"Failed to fetch products from Shopify",
			);
		}

		const productsConnection = data.data?.products;

		if (!productsConnection || !productsConnection.edges) {
			return [];
		}

		// Helper to map GraphQL weightUnit enum to lowercase abbreviation
		const mapWeightUnit = (unit: string): string => {
			if (!unit) return "lb";
			const u = unit.toUpperCase();
			if (u === "POUNDS" || u === "LB") return "lb";
			if (u === "KILOGRAMS" || u === "KG") return "kg";
			if (u === "GRAMS" || u === "G") return "g";
			if (u === "OUNCES" || u === "OZ") return "oz";
			return unit.toLowerCase();
		};

		// Helper to calculate grams from weight value and unit
		const calculateGrams = (value: number, unit: string): number => {
			if (!value) return 0;
			if (!unit) return 0;
			const u = unit.toUpperCase();
			if (u === "GRAMS" || u === "G") return value;
			if (u === "KILOGRAMS" || u === "KG") return value * 1000;
			if (u === "POUNDS" || u === "LB") return Math.round(value * 453.59237);
			if (u === "OUNCES" || u === "OZ") return Math.round(value * 28.34952);
			return value;
		};

		// Flatten the array so your controller gets an array it can .filter()
		return productsConnection.edges.map((edge: any) => {
			const product = edge.node;

			// 1. Gather all asset files found in media connection
			const allMediaItems =
				product.media?.edges
					?.map((mEdge: any) => {
						const node = mEdge.node;
						if (node.mediaContentType === "IMAGE") {
							return { type: "image", src: node.image?.url };
						} else if (node.mediaContentType === "VIDEO") {
							// Grab the highest resolution or first video source URL
							return { type: "video", src: node.sources?.[0]?.url };
						}
						return null;
					})
					.filter(Boolean) || [];

			// 2. Format a legacy images array containing only the static image sources
			const staticImages = allMediaItems
				.filter((item: any) => item.type === "image")
				.map((item: any) => ({ src: item.src }));

			const firstImage = staticImages[0] || null;

			return {
				id: product.id.split("/").pop(),
				title: product.title,
				handle: product.handle,
				body_html: product.descriptionHtml,
				vendor: product.vendor,
				product_type: product.productType,
				tags: Array.isArray(product.tags)
					? product.tags.join(", ")
					: product.tags,
				status: product.status?.toLowerCase(),
				created_at: product.createdAt,
				options:
					product.options?.map((opt: any) => ({
						id: opt.id.split("/").pop(),
						name: opt.name,
						values: opt.values || [],
					})) || [],
				variants:
					product.variants?.edges?.map((vEdge: any) => {
						const weightVal =
							vEdge.node.inventoryItem?.measurement?.weight?.value || 0;
						const weightUnit =
							vEdge.node.inventoryItem?.measurement?.weight?.unit || "";

						return {
							id: vEdge.node.id.split("/").pop(),
							title: vEdge.node.title,
							price: vEdge.node.price,
							sku: vEdge.node.sku,
							inventory_quantity: vEdge.node.inventoryQuantity || 0,
							weight: weightVal,
							weight_unit: mapWeightUnit(weightUnit),
							grams: calculateGrams(weightVal, weightUnit),
						};
					}) || [],

				// This maps the complete list of images back to your old schema format
				images: staticImages,
				image: firstImage,

				// OPTIONAL: Add this new array parameter to keep track of the videos too!
				media: allMediaItems,
			};
		});
	} catch (error) {
		console.error(error);
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
