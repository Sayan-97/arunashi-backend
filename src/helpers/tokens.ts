import { SignJWT, jwtVerify } from "jose";
import { env } from "@/configs/env";
import type { User } from "@/generated/prisma/client";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function createAccessToken(user: User) {
	return new SignJWT({
		sub: user.id,
		role: user.role,
	})
		.setProtectedHeader({
			alg: "HS256",
		})
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(secret);
}

export async function verifyAccessToken(token: string) {
	const { payload } = await jwtVerify(token, secret);

	return payload;
}
