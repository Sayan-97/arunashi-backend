import express, { type Express } from "express";
import { sendResponse } from "./helpers/sendResponse";

const app: Express = express();

app.get(["/", "/health"], (_res, res) => {
	return sendResponse(res, 200, {
		success: true,
		message: "Server up and running!",
	});
});

app.all(/.*/, (_req, res) => {
	return sendResponse(res, 404, {
		success: false,
		message: "Route not found",
	});
});

export default app;
