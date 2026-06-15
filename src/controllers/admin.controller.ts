import type { Request, Response } from "express";
import {
	approveRegistration,
	getPendingRegistrations,
	getApprovedRetailers,
} from "@/services/admin.service";
import { sendResponse } from "@/helpers/sendResponse";

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
