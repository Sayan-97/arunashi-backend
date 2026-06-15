import { prisma } from "../prisma";
import argon2 from "argon2";

async function onboardAdmin() {
	const email = process.env.ADMIN_EMAIL || "admin@arunashi.com";
	const password = process.env.ADMIN_PASSWORD || "admin@1234";
	const name = process.env.ADMIN_NAME || "Arunashi Admin";

	console.log(`Onboarding admin user: ${name} (${email})...`);

	try {
		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			console.log(
				`User with email ${email} already exists! Upgrading role to ADMIN...`,
			);
			await prisma.user.update({
				where: { email },
				data: { role: "ADMIN" },
			});
			console.log("Admin upgraded successfully!");
			return;
		}

		const passwordHash = await argon2.hash(password);

		const admin = await prisma.user.create({
			data: {
				name,
				email,
				password: passwordHash,
				role: "ADMIN",
			},
		});

		console.log("Admin user created successfully:", admin);
	} catch (error) {
		console.error("Error creating admin user:", error);
	} finally {
		await prisma.$disconnect();
	}
}

onboardAdmin();
