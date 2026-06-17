import { z } from "zod";

export const activateSchema = z
	.object({
		token: z.string().nonempty("Token is required"),
		password: z
			.string()
			.nonempty("Password is required")
			.min(6, { error: "Password must be at least 6 characters" }),
		confirmPassword: z.string().nonempty("Confirm password is required"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type ActivateInput = z.infer<typeof activateSchema>;

export const loginSchema = z.object({
	email: z.email(),
	password: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().nonempty("Current password is required"),
		newPassword: z
			.string()
			.nonempty("New password is required")
			.min(6, { error: "New password must be at least 6 characters" }),
		confirmPassword: z.string().nonempty("Confirm password is required"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
