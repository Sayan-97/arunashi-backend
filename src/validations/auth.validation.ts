import { z } from "zod";

export const activateSchema = z.object({
	token: z.string().nonempty("Token is required"),
	password: z
		.string()
		.nonempty("Password is required")
		.min(6, { error: "Password must be at least 6 characters" }),
});

export type ActivateInput = z.infer<typeof activateSchema>;

export const loginSchema = z.object({
	email: z.email(),
	password: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;
