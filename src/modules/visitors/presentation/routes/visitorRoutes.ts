import { Router } from "express";
import { visitorController } from "../../container";
import { jwtMiddleware } from "../../../../shared/middleware/jwtMiddleware";
import { rbacMiddleware } from "../../../../shared/middleware/rbacMiddleware";
import { UserRole } from "../../../auth/domain/entities/User";
import { uploadMiddleware } from "../../../../shared/middleware/uploadMiddleware";
import {
  validatePreRegisterVisitor,
  validateLogWalkInVisitor,
  validateRespondToApproval,
} from "../validators/visitorValidators";

const router = Router();

/*
 |--------------------------------------------------------------------------
 | Resident Only — pre-register, view own, cancel
 |--------------------------------------------------------------------------
 */

router.post(
  "/pre-register",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  uploadMiddleware.single("photo"),
  validatePreRegisterVisitor,
  visitorController.preRegister
);

router.get(
  "/my",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  visitorController.listMyVisitors
);

router.delete(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  visitorController.cancel
);

/*
 |--------------------------------------------------------------------------
 | Security Only — walk-in + check-in + check-out
 |--------------------------------------------------------------------------
 */

router.post(
  "/walk-in",
  jwtMiddleware,
  rbacMiddleware(UserRole.SECURITY),
  uploadMiddleware.single("photo"),
  validateLogWalkInVisitor,
  visitorController.logWalkIn
);

router.patch(
  "/:id/check-in",
  jwtMiddleware,
  rbacMiddleware(UserRole.SECURITY),
  uploadMiddleware.single("photo"),
  visitorController.checkIn
);

router.patch(
  "/:id/check-out",
  jwtMiddleware,
  rbacMiddleware(UserRole.SECURITY),
  visitorController.checkOut
);

/*
 |--------------------------------------------------------------------------
 | Resident + Security — approve/reject pending visitors
 |--------------------------------------------------------------------------
 */

router.post(
  "/:id/respond",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT, UserRole.SECURITY),
  validateRespondToApproval,
  visitorController.respond
);

/*
 |--------------------------------------------------------------------------
 | Security + Admin — read-only queries
 |--------------------------------------------------------------------------
 */

router.get(
  "/current",
  jwtMiddleware,
  rbacMiddleware(UserRole.SECURITY, UserRole.ADMIN),
  visitorController.listCurrentlyInside
);

router.get(
  "/search",
  jwtMiddleware,
  rbacMiddleware(UserRole.SECURITY, UserRole.ADMIN),
  visitorController.searchPreRegistered
);

router.get(
  "/dashboard",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.SECURITY),
  visitorController.getDashboardMetrics
);

router.get(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.SECURITY),
  visitorController.listAll
);

/*
 |--------------------------------------------------------------------------
 | Resident + Security + Admin — fetch single visitor
 |--------------------------------------------------------------------------
 */

router.get(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT, UserRole.SECURITY, UserRole.ADMIN),
  visitorController.findById
);

export default router;