import { HttpError } from "@/helpers/errors";
import { prisma } from "@/prisma";
import argon2 from "argon2";
import type { ActivateInput, LoginInput } from "@/validations/auth.validation";
import { createAccessToken } from "@/helpers/tokens";

export async function activateAccount(payload: ActivateInput) {
	const activation = await prisma.activationToken.findUnique({
		where: {
			token: payload.token,
		},
		include: {
			registrationRequest: true,
		},
	});

	if (!activation) {
		throw new HttpError(404, "Invalid token");
	}

	if (activation.expiresAt.getTime() < Date.now()) {
		throw new HttpError(400, "Token expired");
	}

	const passwordHash = await argon2.hash(payload.password);

	const registration = activation.registrationRequest;

	await prisma.$transaction([
		prisma.user.create({
			data: {
				name: registration.name,
				email: registration.email,
				company: registration.company,
				phone: registration.phone,
				address: registration.address,
				press_title: registration.pressTitle,
				password: passwordHash,
				registrationRequestId: registration.id,
			},
		}),

		prisma.activationToken.delete({
			where: {
				id: activation.id,
			},
		}),
	]);
}

export async function login(payload: LoginInput) {
	const user = await prisma.user.findUnique({
		where: {
			email: payload.email,
		},
	});

	if (!user) {
		throw new HttpError(401, "Invalid credentials");
	}

	const valid = await argon2.verify(user.password, payload.password);

	if (!valid) {
		throw new HttpError(401, "Invalid credentials");
	}

	return createAccessToken(user);
}
