import argon2 from "argon2";
import type { JWTPayload } from "jose";
import { HttpError } from "@/helpers/errors";
import { prisma } from "@/prisma";
import type { ActivateInput, LoginInput } from "@/validations/auth.validation";
import {
	createAccessToken,
	createRefreshToken,
	verifyRefreshToken,
} from "@/helpers/tokens";

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
		throw HttpError.NotFound("Invalid Token");
	}

	if (activation.expiresAt.getTime() < Date.now()) {
		throw HttpError.NotFound("Token Expired");
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
		const request = await prisma.registrationRequest.findUnique({
			where: {
				email: payload.email,
			},
		});

		if (request && request.status === "PENDING") {
			throw HttpError.Forbidden("PENDING_APPROVAL");
		}

		throw HttpError.Unauthorized("Invalid credentials");
	}

	const valid = await argon2.verify(user.password, payload.password);

	if (!valid) {
		throw HttpError.Unauthorized("Invalid credentials");
	}

	const accessToken = await createAccessToken(user);
	const refreshTokenString = await createRefreshToken(user);

	// Store refresh token in database
	await prisma.refreshToken.create({
		data: {
			token: refreshTokenString,
			userId: user.id,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
		},
	});

	return { user, accessToken, refreshToken: refreshTokenString };
}

export async function refresh(refreshTokenString: string) {
	let payload: JWTPayload;
	try {
		payload = await verifyRefreshToken(refreshTokenString);
	} catch (_err) {
		throw HttpError.Unauthorized("Invalid or expired refresh token");
	}

	if (payload?.type !== "refresh" || !payload?.sub) {
		throw HttpError.Unauthorized("Invalid refresh token payload");
	}

	// Find in database
	const storedToken = await prisma.refreshToken.findUnique({
		where: { token: refreshTokenString },
		include: { user: true },
	});

	if (!storedToken) {
		throw HttpError.Unauthorized("Refresh token not found or already used");
	}

	if (storedToken.expiresAt.getTime() < Date.now()) {
		// Clean up expired token
		await prisma.refreshToken.delete({ where: { id: storedToken.id } });
		throw HttpError.Unauthorized("Refresh token expired");
	}

	const user = storedToken.user;
	const newAccessToken = await createAccessToken(user);
	const newRefreshTokenString = await createRefreshToken(user);

	// Rotate tokens in database using a transaction
	await prisma.$transaction([
		prisma.refreshToken.delete({
			where: { id: storedToken.id },
		}),
		prisma.refreshToken.create({
			data: {
				token: newRefreshTokenString,
				userId: user.id,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		}),
	]);

	return {
		user,
		accessToken: newAccessToken,
		refreshToken: newRefreshTokenString,
	};
}

export async function logout(refreshTokenString: string) {
	const storedToken = await prisma.refreshToken.findUnique({
		where: { token: refreshTokenString },
	});
	if (storedToken) {
		await prisma.refreshToken.delete({
			where: { id: storedToken.id },
		});
	}
}
