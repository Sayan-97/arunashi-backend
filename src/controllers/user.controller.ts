import type { Request, Response } from "express";
import { getProfile } from "@/services/user.service";
import { HttpError } from "@/helpers/errors";

export async function getProfileController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized();
	}

	const user = await getProfile(req.user.id);

	res.json({
		success: true,
		data: user,
	});
}
