import { HttpError } from "@/helpers/errors";
import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/helpers/tokens";
export async function authenticate(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	const authHeader = req.headers.authorization;

	if (!authHeader?.startsWith("Bearer ")) {
		throw new HttpError(401, "Unauthorized");
	}

	const token = authHeader.split(" ")[1];

	const payload = await verifyAccessToken(token);

	req.user = {
		id: payload.sub as string,
		role: payload.role as string,
	};

	next();
}

export function authorize(...roles: string[]) {
	return (req: Request, _res: Response, next: NextFunction) => {
		if (!req.user) {
			throw new HttpError(401, "Unauthorized");
		}

		if (!roles.includes(req.user.role)) {
			throw new HttpError(403, "Forbidden");
		}

		next();
	};
}
