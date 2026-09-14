import { Router } from "express";
import { vehicleController } from "../../container";
import { jwtMiddleware } from "../../../../shared/middleware/jwtMiddleware";
import { rbacMiddleware } from "../../../../shared/middleware/rbacMiddleware";
import { UserRole } from "../../../auth/domain/entities/User";
import { validateCreateVehicle, validateUpdateVehicle } from "../validators/vehicleValidators";

const router = Router({ mergeParams: true });

/*
|--------------------------------------------------------------------------
| Admin + Resident — GET only
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT),
  vehicleController.getVehicles
);

/*
|--------------------------------------------------------------------------
| Resident Only — CUD
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  validateCreateVehicle,
  vehicleController.createVehicle
);

router.put(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  validateUpdateVehicle,
  vehicleController.updateVehicle
);

router.delete(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  vehicleController.deleteVehicle
);

export default router;