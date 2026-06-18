import type { CookieOptions } from "express";
import { env } from "@/configs/env";

export const accessTokenCookieOptions: CookieOptions = {
	httpOnly: true,
	secure: env.NODE_ENV === "production",
	sameSite: "lax",
	maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

export const refreshTokenCookieOptions: CookieOptions = {
	httpOnly: true,
	secure: env.NODE_ENV === "production",
	sameSite: "lax",
	maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
