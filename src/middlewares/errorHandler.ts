import type { ErrorRequestHandler } from "express";
import { flattenError, ZodError } from "zod";
import { HttpError } from "@/helpers/errors";
import { sendResponse } from "@/helpers/sendResponse";

const formatZodErrors = (err: ZodError) => {
	const { fieldErrors } = flattenError(err);
	return Object.fromEntries(
		Object.entries(fieldErrors).map(([field, msgs]) => [
			field,
			Array.isArray(msgs) ? msgs : [msgs, msgs],
		]),
	) as Record<string, string[]>;
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
	let statusCode: number = 500;
	let errMessage: unknown = "Internal Server Error";
	let errStack: string | undefined;

	if (err instanceof ZodError) {
		statusCode = 400;
		errMessage = formatZodErrors(err);
	} else if (err instanceof HttpError) {
		statusCode = err.status;
		errMessage = err.message;
		errStack = err.stack;
	} else if (err instanceof Error) {
		statusCode = 500;
		errMessage = err.message;
		errStack = err.stack;
	}

	return sendResponse(res, statusCode, {
		success: false,
		error: errMessage,
		stack: errStack,
	});
};
