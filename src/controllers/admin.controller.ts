import { approveRegistration } from "@/services/admin.service";
import type { Request, Response } from "express";

type ApproveRegistrationParams = {
	id: string;
};

export async function approveRegistrationController(
	req: Request<ApproveRegistrationParams>,
	res: Response,
) {
	const result = await approveRegistration(req.params.id);

	res.json({
		success: true,
		data: result,
	});
}
