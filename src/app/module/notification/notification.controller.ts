import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { NotificationService } from "./notification.service.js";

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await NotificationService.getMyNotificationsFromDB(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notifications retrieved successfully",
    data: result,
  });
});

const markNotificationAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const notificationId = req.params.notificationId as string;

  const result = await NotificationService.markNotificationAsReadInDB(userId, notificationId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification marked as read successfully",
    data: result,
  });
});

export const NotificationController = {
  getMyNotifications,
  markNotificationAsRead,
};
