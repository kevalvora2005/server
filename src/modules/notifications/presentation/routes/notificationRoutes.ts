import { Router } from "express";
import { notificationController } from "../../container";
import { jwtMiddleware } from "../../../../shared/middleware/jwtMiddleware";
import { rbacMiddleware } from "../../../../shared/middleware/rbacMiddleware";
import { UserRole } from "../../../auth/domain/entities/User";
import { validateMarkAsRead } from "../validators/notificationValidators";

const router = Router();

/*
|--------------------------------------------------------------------------
| All authenticated roles — everyone has their own notifications
|--------------------------------------------------------------------------
*/

router.get(
  "/unread-count",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT, UserRole.SECURITY),
  notificationController.getUnreadCount
);

router.patch(
  "/read-all",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT, UserRole.SECURITY),
  notificationController.markAllAsRead
);

router.patch(
  "/read",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT, UserRole.SECURITY),
  validateMarkAsRead,
  notificationController.markAsRead
);

router.get(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT, UserRole.SECURITY),
  notificationController.getNotifications
);

router.delete(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT, UserRole.SECURITY),
  notificationController.deleteNotification
);

router.delete(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT, UserRole.SECURITY),
  notificationController.deleteAllNotifications
);

export default router;