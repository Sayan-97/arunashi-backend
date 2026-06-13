import { HttpError } from "@/helpers/errors";
import { prisma } from "@/prisma";
import type { RegisterInput } from "@/validations/registration.validation";

export async function createRegistrationRequest(payload: RegisterInput) {
	const existing = await prisma.registrationRequest.findUnique({
		where: {
			email: payload.email,
		},
	});

	if (existing) {
		throw new HttpError(409, "Registration already exists");
	}

	return prisma.registrationRequest.create({
		data: payload,
	});
}
