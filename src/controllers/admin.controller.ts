import type { Request, Response } from "express";
import { approveRegistration } from "@/services/admin.service";
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
