import type { Request, Response } from "express";
import {
	clearAllNotifications,
	getNotifications,
	markAllNotificationsAsRead,
	markNotificationAsRead,
} from "@/services/notification.service";
import { HttpError } from "@/helpers/errors";
import { sendResponse } from "@/helpers/sendResponse";

export async function getNotificationsController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const notifications = await getNotifications();

	return sendResponse(res, 200, {
		success: true,
		message: "Notifications retrieved successfully",
		data: notifications,
	});
}

export async function markAsReadController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	const { id } = req.params as { id: string };
	if (!id) {
		throw HttpError.BadRequest("Notification ID is required");
	}

	const notification = await markNotificationAsRead(id);

	return sendResponse(res, 200, {
		success: true,
		message: "Notification marked as read",
		data: notification,
	});
}

export async function markAllAsReadController(req: Request, res: Response) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	await markAllNotificationsAsRead();

	return sendResponse(res, 200, {
		success: true,
		message: "All notifications marked as read",
	});
}

export async function clearNotificationsController(
	req: Request,
	res: Response,
) {
	if (!req.user) {
		throw HttpError.Unauthorized("Unauthorized");
	}

	await clearAllNotifications();

	return sendResponse(res, 200, {
		success: true,
		message: "Notification history cleared successfully",
	});
}
