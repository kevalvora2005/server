import { DocumentRequest, DocumentRequestStatus, RequestRole } from "../../domain/entities/DocumentRequest";
import { IDocumentRequestRepository } from "../../domain/repositories/IDocumentRequestRepository";
import { IDocumentRequestNotifier } from "../../domain/services/IDocumentRequestNotifier";
import { S3PresignedPostService } from "../../../../shared/services/S3PresignedPostService";
import { DocumentRequestNotFoundError, DocumentRequestNotReadyForUploadError } from "../../domain/errors/DocumentRequestErrors";

export interface ConfirmDocumentUploadDto {
  requestId: number;
  s3Key: string;
  fileName: string;
}

export class ConfirmDocumentUploadUseCase {
  constructor(
    private readonly documentRequestRepository: IDocumentRequestRepository,
    private readonly s3PresignedPostService: S3PresignedPostService,
    private readonly documentRequestNotifier?: IDocumentRequestNotifier,
  ) {}

  async execute(dto: ConfirmDocumentUploadDto): Promise<DocumentRequest> {

    const request = await this.documentRequestRepository.findById(dto.requestId);
    if (!request) {
      throw new DocumentRequestNotFoundError(dto.requestId);
    }

    if (
      request.status !== DocumentRequestStatus.PENDING &&
      request.status !== DocumentRequestStatus.APPROVED
    ) {
      throw new DocumentRequestNotReadyForUploadError();
    }

    const oldStatus = request.status;
    const documentUrl = this.s3PresignedPostService.getObjectUrl(dto.s3Key);

    request.fulfill(documentUrl, dto.fileName);

    const updated = await this.documentRequestRepository.update(request);

    if (this.documentRequestNotifier) {
      await this.documentRequestNotifier.notifyStatusChanged(updated, oldStatus);
    }

    return updated;
  }
}
