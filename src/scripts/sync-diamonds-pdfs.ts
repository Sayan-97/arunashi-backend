import { prisma } from "../prisma";
import fs from "node:fs";
import path from "node:path";

async function syncDiamondsPdfs() {
	console.log("Starting Diamond Shapes & Colors PDF synchronization...");

	const shapesDir = path.join(process.cwd(), "public", "uploads", "shapes");

	if (!fs.existsSync(shapesDir)) {
		console.error(`Error: Shapes directory not found at: ${shapesDir}`);
		process.exit(1);
	}

	try {
		// 1. Empty the existing diamonds table
		console.log("Emptying the existing 'diamonds' database table...");
		const { count: deletedCount } = await prisma.diamond.deleteMany();
		console.log(`Successfully deleted ${deletedCount} old diamond records.`);

		// 2. Read and parse the PDF files
		const files = fs.readdirSync(shapesDir);
		const pdfFiles = files.filter((file) =>
			file.toLowerCase().endsWith(".pdf"),
		);

		console.log(
			`Found ${pdfFiles.length} PDF files in shapes folder. Importing...`,
		);

		let insertedCount = 0;
		for (const filename of pdfFiles) {
			// Extract title and capitalize
			const rawName = filename
				.replace(/^diamond\s+/i, "")
				.replace(/\.pdf$/i, "")
				.trim();

			const name = rawName
				.split(/\s+/)
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(" ");

			const link = `/public/uploads/shapes/${filename}`;

			await prisma.diamond.create({
				data: {
					name,
					link,
				},
			});
			insertedCount++;
		}

		console.log(
			`Successfully synced database! Created ${insertedCount} new diamond records.`,
		);
	} catch (error) {
		console.error("Failed to sync diamond PDFs with database:", error);
	} finally {
		await prisma.$disconnect();
	}
}

syncDiamondsPdfs();
