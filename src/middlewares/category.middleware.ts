import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const uploadDir = path.join(process.cwd(), "public", "uploads", "categories");
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

export const uploadCategoryImage = multer({
	storage: storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
	fileFilter: (_req, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase();
		const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
		if (!allowed.includes(ext)) {
			return cb(new Error("Only image files are allowed"));
		}
		cb(null, true);
	},
});
