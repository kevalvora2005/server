import { Router } from "express";
import { maintenanceController, sendMaintenanceRemindersJob } from "../../container";
import { jwtMiddleware } from "../../../../shared/middleware/jwtMiddleware";
import { rbacMiddleware } from "../../../../shared/middleware/rbacMiddleware";
import { UserRole } from "../../../auth/domain/entities/User";
import {
  validateGenerateInvoices,
  validateUpdateMaintenanceAmount,
} from "../validators/maintenanceValidators";

const router = Router();

/*
|--------------------------------------------------------------------------
| Admin Only — settings, generation, full list, manual settle
|--------------------------------------------------------------------------
*/

router.get(
  "/settings",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  maintenanceController.getMaintenanceAmount
);

router.put(
  "/settings",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  validateUpdateMaintenanceAmount,
  maintenanceController.updateMaintenanceAmount
);

router.post(
  "/invoices/generate",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  validateGenerateInvoices,
  maintenanceController.generateInvoices
);

router.get(
  "/invoices",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  maintenanceController.listInvoices
);

router.post(
  "/invoices/:id/regenerate-receipt",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  maintenanceController.regenerateReceipt
);

router.post(
  "/invoices/apply-penalties",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  async (req, res, next) => {
    try {
      const result = await sendMaintenanceRemindersJob.execute();
      res.status(200).json({
        success: true,
        message: "Overdue penalties and reminders processed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Resident Only — own invoices, apartment-wide (Owner)
|--------------------------------------------------------------------------
*/

router.get(
  "/invoices/my",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  maintenanceController.listMyInvoices
);

router.get(
  "/invoices/apartment",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  maintenanceController.listApartmentInvoices
);

/*
|--------------------------------------------------------------------------
| Admin + Resident — detail view, dashboard, settle payment
|--------------------------------------------------------------------------
*/

router.get(
  "/dashboard",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT),
  maintenanceController.getDashboardMetrics
);

router.patch(
  "/invoices/:id/settle",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  maintenanceController.markInvoiceSettled
);

router.get(
  "/invoices/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT),
  maintenanceController.getInvoice
);

router.get(
  "/invoices/:id/receipt",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT),
  maintenanceController.downloadReceipt
);

export default router;