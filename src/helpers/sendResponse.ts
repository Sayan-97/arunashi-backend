import type { Response } from "express";

type ApiResponse<T = unknown> = {
	success: boolean;
	message?: string;
	data?: T;
	error?: unknown;
	stack?: string;
};

export function sendResponse<T>(
	res: Response,
	statusCode: number,
	payload: ApiResponse<T>,
): Response<ApiResponse<T>> {
	return res.status(statusCode).json(payload);
}
