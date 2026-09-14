import { Router } from "express";
import { bookingController } from "../../container";
import { jwtMiddleware } from "../../../../shared/middleware/jwtMiddleware";
import { rbacMiddleware } from "../../../../shared/middleware/rbacMiddleware";
import { UserRole } from "../../../auth/domain/entities/User";
import {
  validateCreateBooking,
  validateCancelBooking,
  validateRejectBooking,
  validateSettleBooking,
  validateListBookingsQuery,
  validateBulkRecordVotes,
} from "../validators/bookingValidators";

const router = Router();

/*
|--------------------------------------------------------------------------
| 1. Collection-Level & Static Routes (MUST be defined before /:id)
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  bookingController.listMyBookings
);

router.get(
  "/stats",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  bookingController.getStats
);

router.get(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  validateListBookingsQuery,
  bookingController.listBookings
);

router.post(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  validateCreateBooking,
  bookingController.createBooking
);

/*
|--------------------------------------------------------------------------
| 2. Admin-Only Booking Actions & Detailed View
|--------------------------------------------------------------------------
*/

router.get(
  "/:id/detail",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  bookingController.getBookingDetail
);

router.post(
  "/:id/votes",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  validateBulkRecordVotes,
  bookingController.bulkRecordVotes
);

router.post(
  "/:id/finalize",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  bookingController.finalizeBooking
);

router.patch(
  "/:id/approve",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  bookingController.approveBooking
);

router.patch(
  "/:id/reject",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  validateRejectBooking,
  bookingController.rejectBooking
);

/*
|--------------------------------------------------------------------------
| 3. Shared Booking Sub-Resource Actions (Receipt, Cancel, Settle)
|--------------------------------------------------------------------------
*/

router.get(
  "/:id/receipt",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT),
  bookingController.getBookingReceipt
);

router.patch(
  "/:id/cancel",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT),
  validateCancelBooking,
  bookingController.cancelBooking
);

router.patch(
  "/:id/settle",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT),
  validateSettleBooking,
  bookingController.settleBooking
);

/*
|--------------------------------------------------------------------------
| 4. Generic Parameterized Route (MUST be at the very bottom)
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT),
  bookingController.getBooking
);

export default router;
