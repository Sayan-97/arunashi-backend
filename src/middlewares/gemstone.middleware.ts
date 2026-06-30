import multer from "multer";
import path from "path";
import fs from "fs";
import { HttpError } from "../helpers/errors";

const uploadDir = path.join(__dirname, "../../../public/uploads/gemstones");

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, uploadDir);
	},
	filename: (_req, file, cb) => {
		// Keep the original filename, but ensure it's safe
		const originalName = file.originalname;
		cb(null, originalName);
	},
});

const fileFilter = (
	_req: any,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback,
) => {
	if (file.mimetype === "application/pdf") {
		cb(null, true);
	} else {
		cb(HttpError.BadRequest("Only PDF files are allowed"));
	}
};

export const uploadGemstone = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
});
