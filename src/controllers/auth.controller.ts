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
import { realtimeService } from "@/services/realtime.service";

export async function activateAccountController(req: Request, res: Response) {
	const body = activateSchema.parse(req.body);

	const user = await activateAccount(body);

	realtimeService.broadcast("retailers:activated", { email: user.email });

	return sendResponse(res, 200, {
		success: true,
		message: "Account Activated Successfully",
	});
}

export async function loginController(req: Request, res: Response) {
	const body = loginSchema.parse(req.body);

	const { user, accessToken, refreshToken } = await login(body);

	const isAdmin = user.role === "ADMIN";
	const accessCookieName = isAdmin
		? "arunashiAdminAccessToken"
		: "arunashiAccessToken";
	const refreshCookieName = isAdmin
		? "arunashiAdminRefreshToken"
		: "arunashiRefreshToken";

	res.cookie(accessCookieName, accessToken, accessTokenCookieOptions);
	res.cookie(refreshCookieName, refreshToken, refreshTokenCookieOptions);

	const { password: _p, ...userWithoutPassword } = user;

	return sendResponse(res, 200, {
		success: true,
		message: "Login Successful",
		data: userWithoutPassword,
	});
}

export async function refreshController(req: Request, res: Response) {
	const token =
		req.cookies?.arunashiAdminRefreshToken || req.cookies?.arunashiRefreshToken;

	if (!token) {
		throw HttpError.Unauthorized("Refresh token required");
	}

	const { user, accessToken, refreshToken } = await refresh(token);

	const isAdmin = user.role === "ADMIN";
	const accessCookieName = isAdmin
		? "arunashiAdminAccessToken"
		: "arunashiAccessToken";
	const refreshCookieName = isAdmin
		? "arunashiAdminRefreshToken"
		: "arunashiRefreshToken";

	res.cookie(accessCookieName, accessToken, accessTokenCookieOptions);
	res.cookie(refreshCookieName, refreshToken, refreshTokenCookieOptions);

	const { password: _p, ...userWithoutPassword } = user;

	return sendResponse(res, 200, {
		success: true,
		message: "Token refreshed successfully",
		data: userWithoutPassword,
	});
}

export async function logoutController(req: Request, res: Response) {
	const token =
		req.cookies?.arunashiAdminRefreshToken || req.cookies?.arunashiRefreshToken;

	if (token) {
		await logout(token);
	}

	const { maxAge: _am, ...accessClear } = accessTokenCookieOptions;
	const { maxAge: _rm, ...refreshClear } = refreshTokenCookieOptions;

	if (
		req.cookies?.arunashiAdminRefreshToken ||
		req.cookies?.arunashiAdminAccessToken
	) {
		res.clearCookie("arunashiAdminAccessToken", accessClear);
		res.clearCookie("arunashiAdminRefreshToken", refreshClear);
	}

	if (req.cookies?.arunashiRefreshToken || req.cookies?.arunashiAccessToken) {
		res.clearCookie("arunashiAccessToken", accessClear);
		res.clearCookie("arunashiRefreshToken", refreshClear);
	}

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
