import { DocumentRequest, DocumentRequestStatus, RequestRole } from "../../domain/entities/DocumentRequest";
import { IDocumentRequestRepository } from "../../domain/repositories/IDocumentRequestRepository";
import { S3PresignedPostService, PresignedPostResult } from "../../../../shared/services/S3PresignedPostService";
import { DocumentRequestNotFoundError, DocumentRequestNotReadyForUploadError } from "../../domain/errors/DocumentRequestErrors";

export interface GetDocumentUploadUrlDto {
  requestId: number;
  fileName: string;
  contentType: string;
}

export interface GetDocumentUploadUrlResult {
  url: string;
  fields: Record<string, string>;
  key: string;
}

export class GetDocumentUploadUrlUseCase {
  constructor(
    private readonly documentRequestRepository: IDocumentRequestRepository,
    private readonly s3PresignedPostService: S3PresignedPostService,
  ) { }

  async execute(dto: GetDocumentUploadUrlDto): Promise<GetDocumentUploadUrlResult> {

    const request = await this.documentRequestRepository.findById(dto.requestId);
    if (!request) {
      throw new DocumentRequestNotFoundError(dto.requestId);
    }

    if (
      request.targetRole === RequestRole.ADMIN &&
      request.status !== DocumentRequestStatus.APPROVED
    ) {
      throw new DocumentRequestNotReadyForUploadError();
    }

    if (
      request.status !== DocumentRequestStatus.PENDING &&
      request.status !== DocumentRequestStatus.APPROVED
    ) {
      throw new DocumentRequestNotReadyForUploadError();
    }

    const sanitizedFileName = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `society-documents/request-${dto.requestId}/${Date.now()}-${sanitizedFileName}`;

    const presignedPost: PresignedPostResult =
      await this.s3PresignedPostService.generatePresignedPost({
        key,
        contentType: dto.contentType,
        maxSizeBytes: 10 * 1024 * 1024,
        expiresInSeconds: 300,
      });

    return {
      url: presignedPost.url,
      fields: presignedPost.fields,
      key,
    };
  }
}
