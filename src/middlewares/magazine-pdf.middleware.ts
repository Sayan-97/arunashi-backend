import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const uploadDir = path.join(
	process.cwd(),
	"public",
	"uploads",
	"magazine-pdfs",
);
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, uploadDir);
	},
	filename: (_req, file, cb) => {
		cb(null, `${Date.now()}-${file.originalname}`);
	},
});

export const uploadMagazinePdf = multer({
	storage: storage,
	limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit
	fileFilter: (_req, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase();
		if (file.fieldname === "pdf" && ext !== ".pdf") {
			return cb(new Error("Only PDF files are allowed for the magazine"));
		}
		if (file.fieldname === "image" && !ext.match(/\.(jpg|jpeg|png|webp)$/i)) {
			return cb(
				new Error("Only images (jpg/jpeg/png/webp) are allowed for the cover"),
			);
		}
		cb(null, true);
	},
});
