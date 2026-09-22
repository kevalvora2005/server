import { CloudinaryService } from "../../shared/services/CloudinaryService";
import { S3PresignedPostService } from "../../shared/services/S3PresignedPostService";
import { DocumentRequestRepository } from "./infrastructure/repositories/DocumentRequestRepository";
import { DocumentRequestVoteRepository } from "./infrastructure/repositories/DocumentRequestVoteRepository";
import { ResidentRepository } from "../residents/infrastructure/repositories/ResidentRepository";
import { DocumentRequestNotifier } from "./infrastructure/services/DocumentRequestNotifier";
import { CreateDocumentRequestUseCase } from "./application/use-cases/CreateDocumentRequestUseCase";
import { GetMyRequestsUseCase } from "./application/use-cases/GetMyRequestsUseCase";
import { GetReceivedRequestsUseCase } from "./application/use-cases/GetReceivedRequestsUseCase";
import { UploadDocumentUseCase } from "./application/use-cases/UploadDocumentUseCase";
import { GetDocumentUploadUrlUseCase } from "./application/use-cases/GetDocumentUploadUrlUseCase";
import { ConfirmDocumentUploadUseCase } from "./application/use-cases/ConfirmDocumentUploadUseCase";
import { RejectRequestUseCase } from "./application/use-cases/RejectRequestUseCase";
import { CancelRequestUseCase } from "./application/use-cases/CancelRequestUseCase";
import { BulkRecordDocumentVotesUseCase } from "./application/use-cases/BulkRecordDocumentVotesUseCase";
import { FinalizeDocumentRequestUseCase } from "./application/use-cases/FinalizeDocumentRequestUseCase";
import { GetDocumentRequestDetailUseCase } from "./application/use-cases/GetDocumentRequestDetailUseCase";
import { DocumentRequestController } from "./presentation/controllers/DocumentRequestController";

const documentRequestRepository = new DocumentRequestRepository();
const documentRequestVoteRepository = new DocumentRequestVoteRepository();
const residentRepository = new ResidentRepository();
const cloudinaryService = new CloudinaryService();
const s3PresignedPostService = new S3PresignedPostService();
const documentRequestNotifier = new DocumentRequestNotifier();

const createDocumentRequestUseCase = new CreateDocumentRequestUseCase(
  documentRequestRepository,
  residentRepository,
  documentRequestNotifier,
);
const getMyRequestsUseCase = new GetMyRequestsUseCase(documentRequestRepository);
const getReceivedRequestsUseCase = new GetReceivedRequestsUseCase(documentRequestRepository);
const uploadDocumentUseCase = new UploadDocumentUseCase(documentRequestRepository, cloudinaryService, documentRequestNotifier);
const getDocumentUploadUrlUseCase = new GetDocumentUploadUrlUseCase(documentRequestRepository, s3PresignedPostService);
const confirmDocumentUploadUseCase = new ConfirmDocumentUploadUseCase(documentRequestRepository, s3PresignedPostService, documentRequestNotifier);
const rejectRequestUseCase = new RejectRequestUseCase(documentRequestRepository, documentRequestNotifier);
const cancelRequestUseCase = new CancelRequestUseCase(documentRequestRepository);
const bulkRecordDocumentVotesUseCase = new BulkRecordDocumentVotesUseCase(
  documentRequestRepository,
  documentRequestVoteRepository,
);
const finalizeDocumentRequestUseCase = new FinalizeDocumentRequestUseCase(
  documentRequestRepository,
  documentRequestVoteRepository,
  documentRequestNotifier,
);
const getDocumentRequestDetailUseCase = new GetDocumentRequestDetailUseCase(documentRequestRepository);

export const documentRequestController = new DocumentRequestController(
  createDocumentRequestUseCase,
  getMyRequestsUseCase,
  getReceivedRequestsUseCase,
  uploadDocumentUseCase,
  getDocumentUploadUrlUseCase,
  confirmDocumentUploadUseCase,
  rejectRequestUseCase,
  cancelRequestUseCase,
  bulkRecordDocumentVotesUseCase,
  finalizeDocumentRequestUseCase,
  getDocumentRequestDetailUseCase,
  residentRepository,
  s3PresignedPostService,
);
