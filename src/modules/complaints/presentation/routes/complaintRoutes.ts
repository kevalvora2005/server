import { Router } from "express";
import { complaintController } from "../../container";
import { jwtMiddleware } from "../../../../shared/middleware/jwtMiddleware";
import { rbacMiddleware } from "../../../../shared/middleware/rbacMiddleware";
import { UserRole } from "../../../auth/domain/entities/User";
import {
  validateCreateComplaint,
  validateUpdateComplaintStatus,
  validateCreateComment,
} from "../validators/complaintValidators";
import { uploadMiddleware } from "../../../../shared/middleware/uploadMiddleware";

const router = Router();

/*
|--------------------------------------------------------------------------
| Resident Only — Create + own list + delete 
|--------------------------------------------------------------------------
*/
router.post(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  uploadMiddleware.array("images", 5),
  validateCreateComplaint,
  complaintController.createComplaint
);  

router.get(
  "/my",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  complaintController.listMyComplaints
);

router.delete(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  complaintController.deleteComplaint
);

/*
|--------------------------------------------------------------------------
| Admin Only — full list + status update
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  complaintController.listComplaints
);

router.patch(
  "/:id/status",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  validateUpdateComplaintStatus,
  complaintController.updateStatus
);

/*
|--------------------------------------------------------------------------
| Resident Only — apartment-wide complaints (Owner only, enforced in use-case)
|--------------------------------------------------------------------------
*/

router.get(
  "/apartment",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  complaintController.listApartmentComplaints
);

/*
|--------------------------------------------------------------------------
| Admin + Resident — detail & comments (ownership enforced in use-case)
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT),
  complaintController.getComplaint  
);

router.post(
  "/:id/comments",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT),
  validateCreateComment,
  complaintController.addComment
);

router.get(
  "/:id/comments",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN, UserRole.RESIDENT),
  complaintController.listComments
);

export default router;