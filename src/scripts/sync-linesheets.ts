import { prisma } from "../prisma/index";
import { fetchShopifyProducts } from "../services/product.service";
import fs from "fs";
import path from "path";

async function main() {
	console.log("Starting linesheets PDF sync...");

	const linesheetsDir = path.join(
		__dirname,
		"../../../public/uploads/linesheets",
	);

	if (!fs.existsSync(linesheetsDir)) {
		console.error(`Directory not found: ${linesheetsDir}`);
		return;
	}

	const files = fs.readdirSync(linesheetsDir);
	const pdfFiles = files.filter((file) => file.toLowerCase().endsWith(".pdf"));

	console.log(`Found ${pdfFiles.length} PDF files in ${linesheetsDir}`);

	const shopifyProducts = await fetchShopifyProducts();
	console.log(`Fetched ${shopifyProducts.length} products from Shopify.`);

	const productMap = new Map();
	for (const product of shopifyProducts) {
		const titleClean = product.title.trim().toLowerCase();
		productMap.set(titleClean, product);
	}

	for (const file of pdfFiles) {
		const name = file
			.replace(/\.pdf$/i, "")
			.trim()
			.toLowerCase();
		const product = productMap.get(name);

		if (product) {
			const shopifyId = String(product.id);
			const link = `/public/uploads/linesheets/${file}`;

			await prisma.productData.upsert({
				where: { id: shopifyId },
				update: { linesheetLink: link },
				create: { id: shopifyId, isActive: true, linesheetLink: link },
			});

			console.log(
				`Mapped linesheet for "${product.title}" (${shopifyId}) -> ${link}`,
			);
		} else {
			console.warn(
				`Could not find a Shopify product matching filename: "${file}"`,
			);
		}
	}

	console.log("Sync completed successfully!");
}

main()
	.catch((e) => {
		console.error("Error during sync:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
