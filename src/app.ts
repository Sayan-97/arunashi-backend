import express, { type Express } from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";

import { env } from "@/configs/env";
import { sendResponse } from "@/helpers/sendResponse";
import { HttpError } from "@/helpers/errors";
import { errorHandler } from "@/middlewares/errorHandler";

import { RegistrationRouter } from "@/routes/registration.route";
import { AdminRouter } from "@/routes/admin.route";
import { AuthRouter } from "@/routes/auth.route";
import { UserRouter } from "./routes/user.route";
import { ProductRouter } from "@/routes/product.route";
import { SavedListRouter } from "@/routes/savedList.route";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
	cors({
		origin(origin, callback) {
			if (
				env.NODE_ENV === "development" ||
				!origin ||
				env.WHITELISTED_DOMAINS.includes(origin)
			) {
				callback(null, true);
			} else {
				callback(new Error(`CORS Error: ${origin} is not allowed.`), false);
			}
		},
		credentials: true,
	}),
);
app.use(compression());
app.use(morgan("combined"));
app.use(
	helmet({
		crossOriginResourcePolicy: {
			policy: "cross-origin",
		},
	}),
);

app.get(["/", "/health"], (_req, res) => {
	return sendResponse(res, 200, {
		success: true,
		message: "Server up and running!",
	});
});

app.use("/api/registration", RegistrationRouter);
app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/products", ProductRouter);
app.use("/api/saved-lists", SavedListRouter);

app.all(/.*/, (_req, _res) => {
	throw HttpError.NotFound("Route not found");
});

app.use(errorHandler);

export default app;
