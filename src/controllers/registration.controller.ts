import type { Request, Response } from "express";
import { registerSchema } from "@/validations/registration.validation";
import { createRegistrationRequest } from "@/services/registration.service";
import { sendResponse } from "@/helpers/sendResponse";
import { realtimeService } from "@/services/realtime.service";
import { createNotification } from "@/services/notification.service";

export async function registerRequestController(req: Request, res: Response) {
	const data = registerSchema.parse(req.body);

	const request = await createRegistrationRequest(data);

	// Create and save database notification (which also broadcasts to clients via SSE)
	await createNotification(
		"retailer_request",
		"New Retailer Registration",
		`${request.name} (${request.company}) has submitted an onboarding request.`,
		"/retailers/pending-approvals",
	);

	realtimeService.broadcast("retailers:submitted", request);

	return sendResponse(res, 201, {
		success: true,
		message: "Registration Request Created Successfully",
		data: request,
	});
}
