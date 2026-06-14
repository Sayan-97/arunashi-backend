import type { Request, Response } from "express";
import { getProfile } from "@/services/user.service";
import { HttpError } from "@/helpers/errors";
import { sendResponse } from "@/helpers/sendResponse";

export async function getProfileController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized();
	}

	const user = await getProfile(req.user.id);

	return sendResponse(res, 200, {
		success: true,
		message: "Profile Fetched Successfully",
		data: user,
	});
}
