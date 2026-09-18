import { IComplaintNotifier } from "../../domain/services/IComplaintNotifier";
import { Complaint } from "../../domain/entities/Complaint";
import { notificationService } from "../../../notifications/container";
import { UserModel } from "../../../auth/infrastructure/models/UserModel";
import { ResidentModel } from "../../../residents/infrastructure/models/ResidentModel";
import { UserRole } from "../../../auth/domain/entities/User";

export class ComplaintNotifier implements IComplaintNotifier {
  async notifyStatusChanged(complaint: Complaint, oldStatus: string): Promise<void> {
    try {
      const resident = complaint.resident as { userId?: number } | undefined;
      if (!resident?.userId) return;

      const ticketNumber = `#CMP-${String(complaint.id).padStart(4, "0")}`;
      let key = "notification.complaint_status_changed";
      let params: Record<string, any> = { ticketNumber, status: complaint.status };

      if (complaint.status === "Resolved") {
        key = "notification.complaint_resolved";
        params = { ticketNumber };
      } else if (complaint.status === "In Progress") {
        key = "notification.complaint_assigned";
        params = { ticketNumber };
      }

      await notificationService.notify(
        resident.userId,
        "complaint_status_changed",
        "Complaint Updated",
        `"${complaint.title}" \u2192 ${complaint.status}`,
        { complaintId: complaint.id, status: complaint.status, key, params }
      );
    } catch (err) {
      console.error("Failed to create complaint notification", err);
    }
  }

  async notifyCreated(complaint: Complaint): Promise<void> {
    try {
      const resident = await ResidentModel.findOne({
        where: { id: complaint.residentId },
        include: [{ model: UserModel, as: "user", attributes: ["id", "name"] }],
      });

      const relRes = resident as (ResidentModel & { user?: { name?: string } }) | null;
      const residentName = relRes?.user?.name ?? `Resident #${complaint.residentId}`;
      const ticketNumber = `#CMP-${String(complaint.id).padStart(4, "0")}`;

      const admins = await UserModel.findAll({ where: { role: UserRole.ADMIN } });

      await Promise.all(
        admins.map((admin) =>
          notificationService.notify(
            admin.id,
            "complaint_created",
            "New Complaint",
            `${residentName}: ${complaint.title}`,
            {
              complaintId: complaint.id,
              key: "notification.complaint_lodged",
              params: { ticketNumber, title: complaint.title },
            }
          )
        )
      );
    } catch (err) {
      console.error("Failed to create complaint-created notification", err);
    }
  }

  async notifyCommentAdded(complaint: Complaint, commentContent: string, senderUserId: number): Promise<void> {
    try {
      const resident = complaint.resident || await ResidentModel.findOne({
        where: { id: complaint.residentId },
        include: [{ model: UserModel, as: "user", attributes: ["id", "name"] }],
      });
      const relRes = resident as { userId?: number; user?: { name?: string } } | undefined;
      const residentUserId = relRes?.userId;

      const bodyPreview = commentContent.length > 60
        ? `${commentContent.slice(0, 60)}...`
        : commentContent;

      const ticketNumber = `#CMP-${String(complaint.id).padStart(4, "0")}`;

      if (senderUserId === residentUserId) {
        const residentName = relRes?.user?.name ?? `Resident #${complaint.residentId}`;
        const admins = await UserModel.findAll({ where: { role: UserRole.ADMIN } });

        await Promise.all(
          admins.map((admin) =>
            notificationService.notify(
              admin.id,
              "complaint_comment_added",
              "New Complaint Message",
              `${residentName}: ${bodyPreview}`,
              {
                complaintId: complaint.id,
                key: "notification.complaint_comment",
                params: { ticketNumber, sender: residentName, preview: bodyPreview },
              }
            )
          )
        );
      } else {
        if (residentUserId) {
          const senderUser = await UserModel.findByPk(senderUserId);
          const senderName = senderUser?.name ?? "Admin";

          await notificationService.notify(
            residentUserId,
            "complaint_comment_added",
            "New Complaint Message",
            `${senderName}: ${bodyPreview}`,
            {
              complaintId: complaint.id,
              key: "notification.complaint_comment",
              params: { ticketNumber, sender: senderName, preview: bodyPreview },
            }
          );
        }
      }
    } catch (err) {
      console.error("Failed to create complaint comment notification", err);
    }
  }
}
