import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";

const getMyNotificationsFromDB = async (recipientId: string) => {
  const notifications = await prisma.notification.findMany({
    where: { recipientId },
    orderBy: { createdAt: "desc" },
  });

  return notifications;
};

const markNotificationAsReadInDB = async (recipientId: string, notificationId: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError(404, "Notification not found");
  }

  if (notification.recipientId !== recipientId) {
    throw new AppError(403, "Forbidden! You can only mark your own notifications as read.");
  }

  const updatedNotification = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      readAt: new Date(),
    },
  });

  return updatedNotification;
};

export const NotificationService = {
  getMyNotificationsFromDB,
  markNotificationAsReadInDB,
};
