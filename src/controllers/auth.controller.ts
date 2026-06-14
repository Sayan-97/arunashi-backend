import type { Request, Response } from "express";
import { activateSchema, loginSchema } from "@/validations/auth.validation";
import {
	activateAccount,
	login,
	refresh,
	logout,
} from "@/services/auth.service";
import { getProfile } from "@/services/user.service";
import { sendResponse } from "@/helpers/sendResponse";
import {
	accessTokenCookieOptions,
	refreshTokenCookieOptions,
} from "@/configs/cookie";
import { HttpError } from "@/helpers/errors";

export async function activateAccountController(req: Request, res: Response) {
	const body = activateSchema.parse(req.body);

	await activateAccount(body);

	return sendResponse(res, 200, {
		success: true,
		message: "Account Activated Successfully",
	});
}

export async function loginController(req: Request, res: Response) {
	const body = loginSchema.parse(req.body);

	const { user, accessToken, refreshToken } = await login(body);

	res.cookie("accessToken", accessToken, accessTokenCookieOptions);
	res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

	const { password: _p, ...userWithoutPassword } = user;

	return sendResponse(res, 200, {
		success: true,
		message: "Login Successful",
		data: userWithoutPassword,
	});
}

export async function refreshController(req: Request, res: Response) {
	const token = req.cookies?.refreshToken;

	if (!token) {
		throw HttpError.Unauthorized("Refresh token required");
	}

	const { user, accessToken, refreshToken } = await refresh(token);

	res.cookie("accessToken", accessToken, accessTokenCookieOptions);
	res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

	const { password: _p, ...userWithoutPassword } = user;

	return sendResponse(res, 200, {
		success: true,
		message: "Token refreshed successfully",
		data: userWithoutPassword,
	});
}

export async function logoutController(req: Request, res: Response) {
	const token = req.cookies?.refreshToken;

	if (token) {
		await logout(token);
	}

	const { maxAge: _am, ...accessClear } = accessTokenCookieOptions;
	const { maxAge: _rm, ...refreshClear } = refreshTokenCookieOptions;

	res.clearCookie("accessToken", accessClear);
	res.clearCookie("refreshToken", refreshClear);

	return sendResponse(res, 200, {
		success: true,
		message: "Logged out successfully",
	});
}

export async function getProfileController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const user = await getProfile(req.user.id);

	if (!user) {
		throw HttpError.NotFound("User profile not found");
	}

	const { password: _p, ...userWithoutPassword } = user;

	return sendResponse(res, 200, {
		success: true,
		message: "Profile Fetched Successfully",
		data: userWithoutPassword,
	});
}
