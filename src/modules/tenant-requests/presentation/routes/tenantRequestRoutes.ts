import { Router } from "express";
import { tenantRequestController } from "../../container";
import { jwtMiddleware } from "../../../../shared/middleware/jwtMiddleware";
import { rbacMiddleware } from "../../../../shared/middleware/rbacMiddleware";
import { UserRole } from "../../../auth/domain/entities/User";
import { validateSubmitTenantRequest, validateBulkRecordVotes } from "../validators/tenantRequestValidators";

const router = Router();

/*
|--------------------------------------------------------------------------
| Resident (Owner) Only — submit + revoke
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  validateSubmitTenantRequest,
  tenantRequestController.submitRequest
);

router.post(
  "/revoke-tenancy",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  tenantRequestController.revokeTenancy
);

/*
|--------------------------------------------------------------------------
| Admin Only — list, vote, finalize
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  tenantRequestController.listRequests
);

router.post(
  "/:id/votes",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  validateBulkRecordVotes,
  tenantRequestController.bulkRecordVotes
);

router.post(
  "/:id/finalize",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  tenantRequestController.finalizeRequest
);

/*
|--------------------------------------------------------------------------
| Resident (Owner) Only — view own tenant-request status
|--------------------------------------------------------------------------
*/

router.get(
  "/my",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  tenantRequestController.myRequest
);

/*
|--------------------------------------------------------------------------
| Admin + Resident — detail view
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT),
  tenantRequestController.getRequestDetail
);

export default router;