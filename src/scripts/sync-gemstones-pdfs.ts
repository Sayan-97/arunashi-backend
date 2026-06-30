import { prisma } from "../prisma/index";
import fs from "fs";
import path from "path";

async function main() {
	console.log("Starting gemstones PDF sync...");

	// 1. Delete all existing gemstones
	console.log("Deleting existing gemstone records from database...");
	await prisma.gemstone.deleteMany();
	console.log("Deleted existing records.");

	// 2. Read the directory
	const uploadsDir = path.join(__dirname, "../../../public/uploads/gemstones");

	if (!fs.existsSync(uploadsDir)) {
		console.error(`Directory not found: ${uploadsDir}`);
		return;
	}

	const files = fs.readdirSync(uploadsDir);
	const pdfFiles = files.filter((file) => file.toLowerCase().endsWith(".pdf"));

	console.log(`Found ${pdfFiles.length} PDF files in ${uploadsDir}`);

	// 3. Create a record for each PDF
	for (const file of pdfFiles) {
		// e.g. "amethyst.pdf" -> "Amethyst"
		const name = file
			.replace(/\.pdf$/i, "")
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

		const link = `/public/uploads/gemstones/${file}`;

		await prisma.gemstone.create({
			data: {
				name,
				link,
			},
		});

		console.log(`Created gemstone record: ${name} -> ${link}`);
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
