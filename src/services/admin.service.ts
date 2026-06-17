import { randomUUID } from "node:crypto";
import { HttpError } from "@/helpers/errors";
import { prisma } from "@/prisma";
import { sendActivationEmail } from "./email.service";
import { verifyPassword, hashPassword } from "@/helpers/password";

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

	const activation = await prisma.$transaction(async (tx) => {
		await tx.registrationRequest.update({
			where: {
				id: requestId,
			},
			data: {
				status: "APPROVED",
			},
		});

		await tx.auditLog.create({
			data: {
				action: `Approved retailer registration for ${request.email} (${request.company})`,
			},
		});

		return tx.activationToken.create({
			data: {
				token,
				expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
				registrationRequestId: request.id,
			},
		});
	});

	await sendActivationEmail(request.email, activation.token);

	return {
		success: true,
	};
}

export async function getPendingRegistrations() {
	return prisma.registrationRequest.findMany({
		where: {
			status: "PENDING",
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

export async function getApprovedRetailers() {
	return prisma.user.findMany({
		where: {
			role: "USER",
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

export async function changeAdminPassword(adminId: string, payload: any) {
	const { currentPassword, newPassword } = payload;
	const admin = await prisma.user.findUnique({
		where: { id: adminId },
	});

	if (!admin) {
		throw HttpError.NotFound("Admin not found");
	}

	const isPasswordValid = await verifyPassword(admin.password, currentPassword);
	if (!isPasswordValid) {
		throw HttpError.BadRequest("Invalid current password");
	}

	const newHash = await hashPassword(newPassword);

	await prisma.user.update({
		where: { id: adminId },
		data: { password: newHash },
	});

	// Log action
	await prisma.auditLog.create({
		data: {
			action: "Changed admin password",
		},
	});

	return { success: true };
}

export async function getAuditLogs() {
	return prisma.auditLog.findMany({
		orderBy: { createdAt: "desc" },
	});
}
