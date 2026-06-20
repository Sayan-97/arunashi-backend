import type { Request, Response } from "express";
import { registerSchema } from "@/validations/registration.validation";
import { createRegistrationRequest } from "@/services/registration.service";
import { sendResponse } from "@/helpers/sendResponse";
import { realtimeService } from "@/services/realtime.service";

export async function registerRequestController(req: Request, res: Response) {
	const data = registerSchema.parse(req.body);

	const request = await createRegistrationRequest(data);

	realtimeService.broadcast("retailers:submitted", request);

	return sendResponse(res, 201, {
		success: true,
		message: "Registration Request Created Successfully",
		data: request,
	});
}
