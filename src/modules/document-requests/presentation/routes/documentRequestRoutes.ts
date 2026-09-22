import { Router } from "express";
import multer from "multer";
import { documentRequestController } from "../../container";
import { jwtMiddleware } from "../../../../shared/middleware/jwtMiddleware";
import { rbacMiddleware } from "../../../../shared/middleware/rbacMiddleware";
import { UserRole } from "../../../auth/domain/entities/User";
import {
  validateCreateDocumentRequest,
  validateRejectDocumentRequest,
  validateBulkRecordVotes,
} from "../validators/documentRequestValidators";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, Image, Word, or Excel files are allowed"));
    }
  },
});

/*
|--------------------------------------------------------------------------
| Resident Only — create + own requests
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  validateCreateDocumentRequest,
  documentRequestController.createRequest,
);

router.get(
  "/my-requests",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT),
  documentRequestController.getMyRequests,
);

/*
|--------------------------------------------------------------------------
| Resident + Admin — received requests + upload/reject/cancel
|--------------------------------------------------------------------------
*/

router.get(
  "/received-requests",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT, UserRole.ADMIN),
  documentRequestController.getReceivedRequests,
);

router.post(
  "/:id/upload",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT, UserRole.ADMIN),
  upload.single("document"),
  documentRequestController.uploadDocument,
);

//S3 Direct Upload (Presigned POST)
router.post(
  "/:id/upload-url",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT, UserRole.ADMIN),
  documentRequestController.getUploadUrl,
);

router.post(
  "/:id/confirm-upload",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT, UserRole.ADMIN),
  documentRequestController.confirmUpload,
);

router.post(
  "/:id/reject",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT, UserRole.ADMIN),
  validateRejectDocumentRequest,
  documentRequestController.rejectRequest,
);

router.delete(
  "/:id",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT, UserRole.ADMIN),
  documentRequestController.cancelRequest,
);

router.get(
  "/:id/download-url",
  jwtMiddleware,
  rbacMiddleware(UserRole.RESIDENT, UserRole.ADMIN),
  documentRequestController.getDownloadUrl,
);

/*
|--------------------------------------------------------------------------
| Admin Only — detail + vote + finalize
|--------------------------------------------------------------------------
*/

router.get(
  "/:id/detail",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  documentRequestController.getDetail,
);

router.post(
  "/:id/votes",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  validateBulkRecordVotes,
  documentRequestController.bulkRecordVotes,
);

router.post(
  "/:id/finalize",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  documentRequestController.finalizeRequest,
);

export default router;
