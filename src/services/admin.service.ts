import { HttpError } from "@/helpers/errors";
import { prisma } from "@/prisma";
import { randomUUID } from "node:crypto";

export async function approveRegistration(requestId: string) {
	const request = await prisma.registrationRequest.findUnique({
		where: {
			id: requestId,
		},
	});

	if (!request) {
		throw new HttpError(404, "Request not found");
	}

	if (request.status !== "PENDING") {
		throw new HttpError(400, "Request already processed");
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

	return {
		token,
	};
}
