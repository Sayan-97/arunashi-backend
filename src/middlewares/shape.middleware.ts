import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const uploadDir = path.join(process.cwd(), "public", "uploads", "shapes");
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, uploadDir);
	},
	filename: (_req, file, cb) => {
		// Keep the original filename to maintain clean paths
		cb(null, file.originalname);
	},
});

export const uploadShape = multer({
	storage: storage,
	limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
	fileFilter: (_req, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase();
		if (ext !== ".pdf") {
			return cb(new Error("Only PDF files are allowed"));
		}
		cb(null, true);
	},
});
