import { prisma } from "@/prisma";

export async function getProfile(userId: string) {
	return prisma.user.findUnique({
		where: {
			id: userId,
		},
	});
}
