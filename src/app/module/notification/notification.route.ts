import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import { NotificationController } from "./notification.controller.js";

const router = Router();

router.get(
  "/me",
  checkAuth("SUPER_ADMIN", "INSTRUCTOR", "STUDENT"),
  NotificationController.getMyNotifications,
);

router.patch(
  "/:notificationId/read",
  checkAuth("SUPER_ADMIN", "INSTRUCTOR", "STUDENT"),
  NotificationController.markNotificationAsRead,
);

export const NotificationRoutes = router;
