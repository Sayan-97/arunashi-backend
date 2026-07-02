import fs from "node:fs";
import path from "node:path";
import { prisma } from "../prisma/index";
import { pdfToPng } from "pdf-to-png-converter";

const MONTHS_MAP: { [key: string]: number } = {
	january: 0,
	february: 1,
	march: 2,
	april: 3,
	may: 4,
	june: 5,
	july: 6,
	august: 7,
	september: 8,
	semptember: 8, // handle typo in pre-uploaded filename
	october: 9,
	november: 10,
	december: 11,
};

async function generateCoverFromPdf(pdfFilePath: string): Promise<string> {
	console.log(`Generating cover for: ${pdfFilePath}`);
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

async function main() {
	console.log("--- [START] Syncing Magazine PDFs ---");
	const pdfsDir = path.join(
		process.cwd(),
		"public",
		"uploads",
		"magazine-pdfs",
	);
	if (!fs.existsSync(pdfsDir)) {
		console.log(`Directory does not exist: ${pdfsDir}`);
		return;
	}

	const files = fs.readdirSync(pdfsDir);
	const pdfFiles = files.filter(
		(f) =>
			f.toLowerCase().endsWith(".pdf") || f.toLowerCase().endsWith(".pdf.pdf"),
	);
	console.log(`Found ${pdfFiles.length} PDF files inside: ${pdfsDir}`);

	const magazines = await prisma.magazine.findMany();
	console.log(`Found ${magazines.length} magazine records in DB.`);

	let syncedCount = 0;

	for (const pdfFile of pdfFiles) {
		const filenameLower = pdfFile.toLowerCase();
		let fileYear: number | null = null;
		let fileMonthIndex: number | null = null;

		// Extract Year (2025 or 2026)
		const yearMatch = filenameLower.match(/\b(2025|2026)\b/);
		if (yearMatch) {
			fileYear = parseInt(yearMatch[1], 10);
		}

		// Extract Month
		for (const key of Object.keys(MONTHS_MAP)) {
			if (filenameLower.includes(key)) {
				fileMonthIndex = MONTHS_MAP[key];
				break;
			}
		}

		// Extract Issue Number
		let fileIssueNo: string | null = null;
		const issueMatch = filenameLower.match(/(?:issue\s*no\.?|issue)\s*(\d+)/i);
		if (issueMatch) {
			fileIssueNo = issueMatch[1].padStart(2, "0"); // Normalize to 2 digits
		}

		if (fileYear === null || fileMonthIndex === null) {
			console.log(`[SKIP] Could not parse year/month for file: ${pdfFile}`);
			continue;
		}

		console.log(
			`File: "${pdfFile}" -> Parsed Year: ${fileYear}, Month Index: ${fileMonthIndex}, Issue No: ${fileIssueNo}`,
		);

		// Find matching magazine record
		const matchedMag = magazines.find((mag) => {
			const magDate = new Date(mag.date);
			return (
				magDate.getUTCFullYear() === fileYear &&
				magDate.getUTCMonth() === fileMonthIndex
			);
		});

		if (!matchedMag) {
			console.log(
				`[WARNING] No DB record matches Year: ${fileYear}, Month Index: ${fileMonthIndex} for file: ${pdfFile}`,
			);
			continue;
		}

		console.log(
			`[MATCH] Found DB record ID: ${matchedMag.id} for "${pdfFile}"`,
		);

		// Generate cover image
		const fullPdfPath = path.join(pdfsDir, pdfFile);
		let imageUrl = matchedMag.image;
		try {
			imageUrl = await generateCoverFromPdf(fullPdfPath);
		} catch (err) {
			console.error(`Failed to generate cover image for ${pdfFile}:`, err);
		}

		// Update DB record
		await prisma.magazine.update({
			where: { id: matchedMag.id },
			data: {
				link: `/public/uploads/magazine-pdfs/${pdfFile}`,
				image: imageUrl,
				issueNumber: fileIssueNo || matchedMag.issueNumber,
			},
		});

		console.log(`[SUCCESS] Updated DB record ID: ${matchedMag.id}`);
		syncedCount++;
	}

	console.log(`--- [FINISHED] Synced ${syncedCount} magazines ---`);
}

main()
	.catch((err) => {
		console.error(err);
	})
	.finally(() => {
		prisma.$disconnect();
	});
