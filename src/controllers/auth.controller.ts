import type { Request, Response } from "express";
import { sendResponse } from "@/helpers/sendResponse";
import { SignupSchema } from "@/validations/auth.validation";
import { hashPassword } from "@/helpers/password";

export async function signup(req: Request, res: Response) {
	const { success, data, error } = SignupSchema.safeParse(req.body);
	if (!success) throw error;

	const { email, password } = data;

	const hashedPassword = hashPassword(password);

	return sendResponse(res, 201, {
		success: true,
		message: "User created successfully",
		data: { email, hashedPassword },
	});
}
