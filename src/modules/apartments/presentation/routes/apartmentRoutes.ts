import { Router } from "express";
import { apartmentController } from "../../container";
import { jwtMiddleware } from "../../../../shared/middleware/jwtMiddleware";
import { rbacMiddleware } from "../../../../shared/middleware/rbacMiddleware";
import { UserRole } from "../../../auth/domain/entities/User";
import {
  validateCreateApartment,
  validateListApartments,
} from "../validators/apartmentValidators";

import multer from "multer";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/*
|--------------------------------------------------------------------------
| Admin Only — import
|--------------------------------------------------------------------------
*/

router.post(
  "/import",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  upload.single("file"),
  apartmentController.importApartments
);

/*
|--------------------------------------------------------------------------
| Admin + Security + Resident — read only
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.SECURITY, UserRole.RESIDENT),
  validateListApartments,
  apartmentController.listApartments
);

router.get(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.SECURITY, UserRole.RESIDENT),
  apartmentController.getApartment
);

export default router;