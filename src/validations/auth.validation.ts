import { z } from "zod";

export const SignupSchema = z.object({
	email: z.email("Invalid email address").nonempty("Email is required"),
	password: z
		.string()
		.nonempty("Password is required")
		.min(6, { error: "Password must be at least 6 characters" }),
});
