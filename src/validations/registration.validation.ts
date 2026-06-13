import { z } from "zod";

export const registerSchema = z.object({
	name: z.string().nonempty("Name is required"),
	email: z.email("Invalid email address").nonempty("Email is required"),
	company: z.string().nonempty("Company is required"),
	phone: z.string().nonempty("Phone is required"),
	address: z.string().nonempty("Address is required"),
	pressTitle: z.string().nonempty("Press title is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
