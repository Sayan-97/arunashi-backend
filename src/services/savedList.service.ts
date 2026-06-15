import { prisma } from "@/prisma";
import { HttpError } from "@/helpers/errors";

export async function createSavedList(
	userId: string,
	name: string,
	items: any,
) {
	return prisma.savedList.create({
		data: {
			name,
			items,
			userId,
		},
	});
}

export async function getSavedLists(userId: string) {
	return prisma.savedList.findMany({
		where: {
			userId,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

export async function deleteSavedList(userId: string, id: string) {
	const existing = await prisma.savedList.findFirst({
		where: {
			id,
			userId,
		},
	});

	if (!existing) {
		throw HttpError.NotFound("Saved list not found");
	}

	return prisma.savedList.delete({
		where: {
			id,
		},
	});
}
