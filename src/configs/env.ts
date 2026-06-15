import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
	PORT: z.coerce.number().default(8000),
	NODE_ENV: z.enum(["development", "production"]).default("development"),
	WHITELISTED_DOMAINS: z
		.array(z.string())
		.default([
			"http://localhost:3000",
			"https://arunashi.vercel.app",
			"https://arunashi-admin.vercel.app",
		]),
	DATABASE_URL: z.string(),
	JWT_SECRET: z.string(),
	GMAIL_USER: z.string(),
	GMAIL_APP_PASSWORD: z.string(),
	FRONTEND_URL: z.string(),
	SHOPIFY_STORE_DOMAIN: z.string(),
	SHOPIFY_ADMIN_ACCESS_TOKEN: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	console.error(
		"Invalid environment variables:",
		parsedEnv.error.flatten().fieldErrors,
	);

	process.exit(1);
}

export const env = parsedEnv.data;
