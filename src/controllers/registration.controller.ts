import type { Request, Response } from "express";
import { registerSchema } from "@/validations/registration.validation";
import { createRegistrationRequest } from "@/services/registration.service";
import { sendResponse } from "@/helpers/sendResponse";

export async function registerRequestController(req: Request, res: Response) {
	const data = registerSchema.parse(req.body);

	const request = await createRegistrationRequest(data);

	return sendResponse(res, 201, {
		success: true,
		message: "Registration Request Created Successfully",
		data: request,
	});
}
