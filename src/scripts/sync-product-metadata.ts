import { prisma } from "../prisma/index";
import { fetchShopifyProducts } from "../services/product.service";

const SHEET_CSV_URL =
	"https://docs.google.com/spreadsheets/d/1tgkXX3avYMXp2cjm1ixe4fyZ4cW4nG69mc1WDA0yZmo/export?format=csv&gid=0";

// RFC 4180 compliant CSV parser to handle linebreaks and quotes within cells
function parseCSV(csvText: string): string[][] {
	const result: string[][] = [];
	let row: string[] = [];
	let col = "";
	let inQuotes = false;

	for (let i = 0; i < csvText.length; i++) {
		const char = csvText[i];
		const nextChar = csvText[i + 1];

		if (inQuotes) {
			if (char === '"') {
				if (nextChar === '"') {
					col += '"';
					i++; // skip next quote
				} else {
					inQuotes = false;
				}
			} else {
				col += char;
			}
		} else {
			if (char === '"') {
				inQuotes = true;
			} else if (char === ",") {
				row.push(col);
				col = "";
			} else if (char === "\n" || char === "\r") {
				if (char === "\r" && nextChar === "\n") {
					i++;
				}
				row.push(col);
				result.push(row);
				row = [];
				col = "";
			} else {
				col += char;
			}
		}
	}
	if (row.length > 0 || col !== "") {
		row.push(col);
		result.push(row);
	}
	return result;
}

interface SkuMetadata {
	gemstoneDetails: string;
	diamondShapeDetails: string;
	certificates: string[];
}

async function main() {
	console.log("--- Starting Product Metadata Sync from Google Sheet ---");

	// 1. Fetch Google Sheet CSV
	console.log(`Fetching CSV from URL: ${SHEET_CSV_URL}`);
	const res = await fetch(SHEET_CSV_URL);
	if (!res.ok) {
		throw new Error(`Failed to fetch Google Sheet: ${res.statusText}`);
	}
	const csvText = await res.text();
	console.log(`Fetched CSV. Size: ${csvText.length} bytes.`);

	// 2. Parse CSV
	const allRows = parseCSV(csvText);
	console.log(`Parsed ${allRows.length} total rows from CSV.`);

	// 3. Process & Group rows by SKU
	// Headers: row 8 (0-indexed). Example row: row 9. Data starts at row 10.
	const dataRows = allRows.slice(10);
	const skuDataMap = new Map<string, SkuMetadata>();

	for (const row of dataRows) {
		if (row.length < 14) continue;

		const sku = row[0]?.trim();
		if (
			!sku ||
			sku.toLowerCase() === "example" ||
			sku.toLowerCase() === "notes" ||
			sku.startsWith("---")
		) {
			continue;
		}

		const gemstoneDetails = row[3]?.trim() || "";
		const diamondShapeDetails = row[4]?.trim() || "";
		const certificate = row[13]?.trim() || "";

		if (!skuDataMap.has(sku)) {
			skuDataMap.set(sku, {
				gemstoneDetails: "",
				diamondShapeDetails: "",
				certificates: [],
			});
		}

		const current = skuDataMap.get(sku)!;

		// Keep first non-empty gemstone details
		if (gemstoneDetails && !current.gemstoneDetails) {
			current.gemstoneDetails = gemstoneDetails;
		}

		// Keep first non-empty diamond shape details
		if (diamondShapeDetails && !current.diamondShapeDetails) {
			current.diamondShapeDetails = diamondShapeDetails;
		}

		// Collect unique certificate URLs
		if (certificate && !current.certificates.includes(certificate)) {
			current.certificates.push(certificate);
		}
	}

	console.log(`Aggregated metadata for ${skuDataMap.size} unique SKUs.`);

	// 4. Fetch Shopify Products to map SKU -> Product ID
	console.log("Fetching products from Shopify...");
	const shopifyProducts = await fetchShopifyProducts();
	console.log(
		`Fetched ${shopifyProducts.length} active products from Shopify.`,
	);

	const skuToProductIdMap = new Map<string, string>();
	for (const product of shopifyProducts) {
		if (product.variants) {
			for (const variant of product.variants) {
				if (variant.sku) {
					const normalizedSku = variant.sku.trim().toLowerCase();
					skuToProductIdMap.set(normalizedSku, String(product.id));
				}
			}
		}
	}

	let updatedCount = 0;

	// 5. Update database records
	for (const [sku, metadata] of skuDataMap.entries()) {
		const normalizedSku = sku.toLowerCase();
		const shopifyId = skuToProductIdMap.get(normalizedSku);

		if (!shopifyId) {
			console.warn(`[SKIP] No Shopify product found matching SKU: "${sku}"`);
			continue;
		}

		const certificatesStr = metadata.certificates.join(",");

		await prisma.productData.upsert({
			where: { id: shopifyId },
			update: {
				gemstoneDetails: metadata.gemstoneDetails || null,
				diamondShapeDetails: metadata.diamondShapeDetails || null,
				certificates: certificatesStr || null,
			},
			create: {
				id: shopifyId,
				isActive: true, // Default to true so they appear on the site
				gemstoneDetails: metadata.gemstoneDetails || null,
				diamondShapeDetails: metadata.diamondShapeDetails || null,
				certificates: certificatesStr || null,
			},
		});

		console.log(
			`[SUCCESS] Synced metadata for "${sku}" (Shopify ID: ${shopifyId})`,
		);
		updatedCount++;
	}

	console.log(
		`--- Finished metadata sync. Successfully updated ${updatedCount} products. ---`,
	);
}

main()
	.catch((err) => {
		console.error("Sync Error:", err);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
