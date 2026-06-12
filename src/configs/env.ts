import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
	PORT: z.coerce.number().default(5000),
	NODE_ENV: z.enum(["development", "production"]).default("development"),
	WHITELISTED_DOMAINS: z.array(z.string()).default(["http://localhost:3000"]),
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
