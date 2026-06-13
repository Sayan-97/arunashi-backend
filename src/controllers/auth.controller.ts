import type { Request, Response } from "express";
import { activateSchema } from "@/validations/auth.validation";
import { activateAccount } from "@/services/auth.service";

export async function activateAccountController(req: Request, res: Response) {
	const body = activateSchema.parse(req.body);

	await activateAccount(body);

	res.json({
		success: true,
	});
}
