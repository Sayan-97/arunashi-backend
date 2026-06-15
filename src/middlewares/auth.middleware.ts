import { HttpError } from "@/helpers/errors";
import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/helpers/tokens";

export async function authenticate(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	const token = req.cookies?.adminAccessToken || req.cookies?.accessToken;

	if (!token) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	try {
		const payload = await verifyAccessToken(token);

		req.user = {
			id: payload.sub as string,
			role: payload.role as string,
		};

		next();
	} catch (_error) {
		throw HttpError.Unauthorized("Unauthorized");
	}
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
