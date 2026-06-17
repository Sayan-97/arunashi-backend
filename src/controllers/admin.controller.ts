import type { Request, Response } from "express";
import {
	approveRegistration,
	getPendingRegistrations,
	getApprovedRetailers,
	changeAdminPassword,
	getAuditLogs,
} from "@/services/admin.service";
import { sendResponse } from "@/helpers/sendResponse";
import { changePasswordSchema } from "@/validations/auth.validation";
import { HttpError } from "@/helpers/errors";

type ApproveRegistrationParams = {
	id: string;
};

export async function approveRegistrationController(
	req: Request<ApproveRegistrationParams>,
	res: Response,
) {
	const result = await approveRegistration(req.params.id);

	return sendResponse(res, 200, {
		success: true,
		message: "Registration approved successfully",
		data: result,
	});
}

export async function getPendingRegistrationsController(
	_req: Request,
	res: Response,
) {
	const data = await getPendingRegistrations();

	return sendResponse(res, 200, {
		success: true,
		data,
	});
}

export async function getApprovedRetailersController(
	_req: Request,
	res: Response,
) {
	const data = await getApprovedRetailers();

	return sendResponse(res, 200, {
		success: true,
		data,
	});
}

export async function changePasswordController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const body = changePasswordSchema.parse(req.body);

	await changeAdminPassword(req.user.id, body);

	return sendResponse(res, 200, {
		success: true,
		message: "Password changed successfully",
	});
}

export async function getAuditLogsController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const data = await getAuditLogs();

	return sendResponse(res, 200, {
		success: true,
		data,
	});
}
