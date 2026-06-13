import type { Request, Response } from "express";
import { registerSchema } from "@/validations/registration.validation";
import { createRegistrationRequest } from "@/services/registration.service";

export async function registerRequestController(req: Request, res: Response) {
	const data = registerSchema.parse(req.body);

	const request = await createRegistrationRequest(data);

	res.status(201).json({
		success: true,
		data: request,
	});
}
