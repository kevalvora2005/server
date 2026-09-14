import { Router } from "express";
import { noticeController } from "../../container";
import { jwtMiddleware } from "../../../../shared/middleware/jwtMiddleware";
import { rbacMiddleware } from "../../../../shared/middleware/rbacMiddleware";
import { UserRole } from "../../../auth/domain/entities/User";
import { validateCreateNotice, validateUpdateNotice } from "../validators/noticeValidators";

const router = Router();

/*
|--------------------------------------------------------------------------
| Admin + Resident — GET only
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT),
  noticeController.listNotices
);

router.get(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT),
  noticeController.getNotice
);

/*
|--------------------------------------------------------------------------
| Admin Only — CUD + Toggle Pin
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  validateCreateNotice,
  noticeController.createNotice
);

router.put(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  validateUpdateNotice,
  noticeController.updateNotice
);

router.delete(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  noticeController.deleteNotice
);

router.patch(
  "/:id/toggle-pin",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  noticeController.togglePin
);

export default router;
