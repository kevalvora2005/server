import { IDocumentRequestNotifier } from "../../domain/services/IDocumentRequestNotifier";
import { DocumentRequest, DocumentRequestStatus, RequestRole } from "../../domain/entities/DocumentRequest";
import { notificationService } from "../../../notifications/container";
import { UserModel } from "../../../auth/infrastructure/models/UserModel";
import { ResidentModel } from "../../../residents/infrastructure/models/ResidentModel";
import { UserRole } from "../../../auth/domain/entities/User";

export class DocumentRequestNotifier implements IDocumentRequestNotifier {
  async notifyCreated(request: DocumentRequest): Promise<void> {
    try {
      const docName = request.customDocumentName || request.documentType;

      if (request.requesterRole === RequestRole.TENANT && request.targetId) {
        // 1. Tenant created request -> notify ONLY the apartment owner
        const ownerResident = await ResidentModel.findByPk(request.targetId);
        if (ownerResident?.userId) {
          await notificationService.notify(
            ownerResident.userId,
            "document_request_created",
            "New Document Request",
            `A tenant has submitted a request for "${docName}".`,
            {
              documentRequestId: request.id,
              key: "notification.document_request_created_tenant",
              params: { docName },
            }
          );
        }
      } else {
        // 2. Owner created request -> notify ONLY Admins (who can vote / approve / upload)
        const admins = await UserModel.findAll({ where: { role: UserRole.ADMIN } });
        await Promise.all(
          admins.map((admin) =>
            notificationService.notify(
              admin.id,
              "document_request_created",
              "New Document Request",
              `An owner has submitted a request for "${docName}". Review and record votes.`,
              {
                documentRequestId: request.id,
                key: "notification.document_request_created_owner",
                params: { docName },
              }
            )
          )
        );
      }
    } catch (error) {
      console.error("Failed to send document-request-created notifications:", error);
    }
  }

  async notifyStatusChanged(request: DocumentRequest, _oldStatus?: string): Promise<void> {
    try {
      const docName = request.customDocumentName || request.documentType;
      const requesterResident = await ResidentModel.findByPk(request.requesterId);
      const requesterUserId = requesterResident?.userId;

      let title = "Document Request Updated";
      let body = `Your document request for "${docName}" status changed to ${request.status}.`;
      let type: "document_request_status_changed" | "document_request_approved" | "document_request_uploaded" | "document_request_rejected" = "document_request_status_changed";
      let key = "notification.document_request_status_changed";
      let params: Record<string, any> = { docName, status: request.status };

      if (request.status === DocumentRequestStatus.APPROVED) {
        type = "document_request_approved";
        title = "Document Request Approved";
        body = `Your request for "${docName}" has been approved.`;
        key = "notification.document_request_approved";
        params = { docName };
      } else if (request.status === DocumentRequestStatus.UPLOADED) {
        type = "document_request_uploaded";
        title = "Document Ready";
        body = `Your requested document "${docName}" has been uploaded and is ready to download.`;
        key = "notification.document_request_uploaded";
        params = { docName };
      } else if (request.status === DocumentRequestStatus.REJECTED) {
        type = "document_request_rejected";
        title = "Document Request Rejected";
        body = `Your request for "${docName}" was rejected.${request.rejectionReason ? ` Reason: ${request.rejectionReason}` : ""}`;
        key = "notification.document_request_rejected";
        params = { docName };
      }

      // Notify requester
      if (requesterUserId) {
        await notificationService.notify(
          requesterUserId,
          type,
          title,
          body,
          { documentRequestId: request.id, status: request.status, key, params }
        );
      }
    } catch (error) {
      console.error("Failed to send document-request status change notification:", error);
    }
  }
}
