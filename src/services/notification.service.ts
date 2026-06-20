import { prisma } from "@/prisma";
import { realtimeService } from "@/services/realtime.service";

export async function createNotification(
	type: string,
	title: string,
	message: string,
	link: string,
) {
	const notification = await prisma.notification.create({
		data: {
			type,
			title,
			message,
			link,
		},
	});

	// Broadcast the created notification to all SSE client streams
	realtimeService.broadcast("notification:created", notification);

	return notification;
}

export async function getNotifications() {
	// 1. Prune notifications older than 50 days
	const fiftyDaysAgo = new Date();
	fiftyDaysAgo.setDate(fiftyDaysAgo.getDate() - 50);

	try {
		await prisma.notification.deleteMany({
			where: {
				createdAt: {
					lt: fiftyDaysAgo,
				},
			},
		});
	} catch (error) {
		console.error("Failed to prune expired notifications:", error);
	}

	// 2. Fetch active notifications
	return prisma.notification.findMany({
		orderBy: {
			createdAt: "desc",
		},
	});
}

export async function markNotificationAsRead(id: string) {
	return prisma.notification.update({
		where: { id },
		data: { read: true },
	});
}

export async function markAllNotificationsAsRead() {
	return prisma.notification.updateMany({
		where: { read: false },
		data: { read: true },
	});
}

export async function clearAllNotifications() {
	return prisma.notification.deleteMany();
}
