import type { Request, Response } from "express";
import { activateSchema, loginSchema } from "@/validations/auth.validation";
import { activateAccount, login } from "@/services/auth.service";

export async function activateAccountController(req: Request, res: Response) {
	const body = activateSchema.parse(req.body);

	await activateAccount(body);

	res.json({
		success: true,
	});
}

export async function loginController(req: Request, res: Response) {
	const body = loginSchema.parse(req.body);

	const token = await login(body);

	res.json({
		success: true,
		token,
	});
}
