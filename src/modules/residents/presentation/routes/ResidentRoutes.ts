import { Router } from "express";

import { residentController } from "../../container";

import { jwtMiddleware } from "../../../../shared/middleware/jwtMiddleware";

import { rbacMiddleware } from "../../../../shared/middleware/rbacMiddleware";
import { UserRole } from "../../../auth/domain/entities/User";

import {
  validateCreateResident,
  validateUpdateResident,
  validateListResidents,
} from "../validators/residentValidators";
import familyMemberRoutes from "../../../family-members/presentation/routes/familyMemberRoutes";

import multer from "multer";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/*
|--------------------------------------------------------------------------
| Admin Only — full CRUD + import + promote
|--------------------------------------------------------------------------
*/

// Create a new resident
router.post(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  validateCreateResident,
  residentController.createResident
);

// Bulk import residents via CSV
router.post(
  "/import",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  upload.single("file"),
  residentController.importResidents
);

// List all residents (with filters)
router.get(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  validateListResidents,
  residentController.listResidents
);

// Promote pending tenants to occupants
router.post(
  "/promote-occupants",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  residentController.promoteOccupants
);

// Get resident by ID
router.get(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  residentController.getResident
);

// Update resident
router.put(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  validateUpdateResident,
  residentController.updateResident
);

// Deactivate resident
router.delete(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  residentController.deactivateResident
);

/*
|--------------------------------------------------------------------------
| Resident Only — own data
|--------------------------------------------------------------------------
*/

// List tenants in own apartment
router.get(
  "/my/tenants",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  residentController.listApartmentTenants
);

// Get own resident record
router.get(
  "/me",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  residentController.getMyResident
);


/*
|--------------------------------------------------------------------------
| Nested — Family Members
|--------------------------------------------------------------------------
*/

router.use(
  "/:residentId/family-members", 
  familyMemberRoutes
);

export default router;