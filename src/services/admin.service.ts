import { randomUUID } from "node:crypto";
import { HttpError } from "@/helpers/errors";
import { prisma } from "@/prisma";

export async function approveRegistration(requestId: string) {
	const request = await prisma.registrationRequest.findUnique({
		where: {
			id: requestId,
		},
	});

	if (!request) {
		throw HttpError.NotFound("Request Not Found");
	}

	if (request.status !== "PENDING") {
		throw HttpError.BadRequest("Request already processed");
	}

	const token = randomUUID();

	await prisma.$transaction([
		prisma.registrationRequest.update({
			where: {
				id: requestId,
			},
			data: {
				status: "APPROVED",
			},
		}),

		prisma.activationToken.create({
			data: {
				token,
				expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
				registrationRequestId: request.id,
			},
		}),
	]);

	return { token };
}
