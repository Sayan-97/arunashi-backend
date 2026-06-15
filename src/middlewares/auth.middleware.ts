import { HttpError } from "@/helpers/errors";
import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/helpers/tokens";

export async function authenticate(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	const adminToken = req.cookies?.arunashiAdminAccessToken;
	const userToken = req.cookies?.arunashiAccessToken;

	if (!adminToken && !userToken) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	// Check if this request is targeting an admin route
	const isAdminRoute =
		req.originalUrl.includes("/admin") || req.path.includes("/admin");

	if (isAdminRoute) {
		if (adminToken) {
			try {
				const payload = await verifyAccessToken(adminToken);
				req.user = {
					id: payload.sub as string,
					role: payload.role as string,
				};
				return next();
			} catch (_error) {
				if (!userToken) {
					throw HttpError.Unauthorized("Unauthorized");
				}
			}
		}

		if (userToken) {
			try {
				const payload = await verifyAccessToken(userToken);
				req.user = {
					id: payload.sub as string,
					role: payload.role as string,
				};
				return next();
			} catch (_error) {
				throw HttpError.Unauthorized("Unauthorized");
			}
		}
	} else {
		if (userToken) {
			try {
				const payload = await verifyAccessToken(userToken);
				req.user = {
					id: payload.sub as string,
					role: payload.role as string,
				};
				return next();
			} catch (_error) {
				if (!adminToken) {
					throw HttpError.Unauthorized("Unauthorized");
				}
			}
		}

		if (adminToken) {
			try {
				const payload = await verifyAccessToken(adminToken);
				req.user = {
					id: payload.sub as string,
					role: payload.role as string,
				};
				return next();
			} catch (_error) {
				throw HttpError.Unauthorized("Unauthorized");
			}
		}
	}

	throw HttpError.Unauthorized("Unauthorized");
}

export function authorize(...roles: string[]) {
	return (req: Request, _res: Response, next: NextFunction) => {
		if (!req.user) {
			throw HttpError.Unauthorized("Unauthorized");
		}

		if (!roles.includes(req.user.role)) {
			throw HttpError.Forbidden("Forbidden");
		}

		next();
	};
}
