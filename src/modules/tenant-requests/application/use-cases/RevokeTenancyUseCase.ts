import { Op } from "sequelize";
import { IResidentRepository } from "../../../residents/domain/repositories/IResidentRepository";
import { IUserRepository } from "../../../auth/domain/repositories/IUserRepository";
import { IVisitorRepository } from "../../../visitors/domain/repositories/IVisitorRepository";
import { IEmailService } from "../../../auth/domain/services/IEmailService";
import { notificationService } from "../../../notifications/container";
import { getIO } from "../../../../shared/socket/socket.server";
import { SOCKET_EVENTS } from "../../../../shared/socket/socket.events";
import { NoActiveTenantToRevokeError, PendingMaintenanceDuesError } from "../../domain/errors/TenantRequestErrors";
import { InvoiceModel } from "../../../maintenance/infrastructure/models/InvoiceModel";
import { InvoiceStatus } from "../../../maintenance/domain/entities/Invoice";
import { VisitorModel } from "../../../visitors/infrastructure/models/VisitorModel";
import { VisitorStatus } from "../../../visitors/domain/entities/Visitor";
import { DocumentRequestModel, DocumentRequestStatus } from "../../../document-requests/infrastructure/models/DocumentRequestModel";
import { ComplaintModel } from "../../../complaints/infrastructure/models/ComplaintModel";
import { ComplaintStatus } from "../../../complaints/domain/entities/Complaint";
import { ApartmentModel } from "../../../apartments/infrastructure/models/ApartmentModel";
import i18n from "../../../../shared/config/i18n";

export class RevokeTenancyUseCase {
  constructor(
    private readonly residentRepository: IResidentRepository,
    private readonly userRepository: IUserRepository,
    private readonly visitorRepository: IVisitorRepository,
    private readonly emailService?: IEmailService,
  ) { }

  async execute(apartmentId: number): Promise<void> {
    const occupant = await this.residentRepository.findActiveTenantByApartmentId(apartmentId);

    if (!occupant) {
      throw new NoActiveTenantToRevokeError();
    }

    const tenantUserId = occupant.userId;
    const tenantResidentId = occupant.id!;

    // 1. Check for pending / unpaid maintenance dues for this tenant resident
    const pendingInvoicesCount = await InvoiceModel.count({
      where: {
        residentId: tenantResidentId,
        status: { [Op.in]: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] },
      },
    });

    if (pendingInvoicesCount > 0) {
      throw new PendingMaintenanceDuesError();
    }

    // 2. Fetch tenant user details for email notification
    const tenantUser = await this.userRepository.findById(tenantUserId);
    const tenantEmail = tenantUser?.email;
    const tenantName = tenantUser?.name || "Resident";

    // 3. Deactivate tenant resident & user account
    occupant.deactivate();
    occupant.markAsNonOccupant();
    occupant.updateMoveOutDate(new Date());
    await this.residentRepository.update(occupant);

    await this.userRepository.deactivate(tenantUserId);

    // 4. Reject all pending/approved visitors pre-registered by this tenant
    await VisitorModel.update(
      { status: VisitorStatus.REJECTED },
      {
        where: {
          residentId: tenantResidentId,
          status: { [Op.in]: [VisitorStatus.PENDING, VisitorStatus.APPROVED] },
        },
      }
    );

    getIO().emit(SOCKET_EVENTS.VISITOR_UPDATED, { apartmentId });

    // 5. Reject all pending/approved document requests for this tenant resident
    await DocumentRequestModel.update(
      {
        status: DocumentRequestStatus.REJECTED,
        rejectionReason: "Tenancy revoked by apartment owner",
      },
      {
        where: {
          [Op.or]: [
            { requesterId: tenantResidentId },
            { targetId: tenantResidentId },
          ],
          status: { [Op.in]: [DocumentRequestStatus.PENDING, DocumentRequestStatus.APPROVED] },
        },
      }
    );

    // 6. Delete all open / in-progress complaints submitted by this tenant resident
    await ComplaintModel.destroy({
      where: {
        residentId: tenantResidentId,
        status: { [Op.in]: [ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS] },
      },
    });

    // 7. Reinstate owner as active occupant
    const owner = await this.residentRepository.findActiveByApartmentId(apartmentId);
    if (owner) {
      owner.markAsOccupant();
      await this.residentRepository.update(owner);
    }

    // 8. Send revocation push notification
    await this.notifyTenant(tenantUserId, apartmentId);

    // 9. Send email notification to tenant
    if (this.emailService && tenantEmail) {
      let unitName = "Your Apartment";
      if (apartmentId) {
        const apartment = await ApartmentModel.findByPk(apartmentId);
        if (apartment) {
          unitName = `${apartment.block}-${apartment.floorNumber}${apartment.unitNumber}`;
        }
      }

      const societyName = process.env.SOCIETY_NAME || "Civic Horizon";
      const lng = tenantUser?.preferredLanguage || "en";

      const subject = i18n.t("email.tenancy_revoked_subject", {
        lng,
        societyName,
        defaultValue: `Tenancy Revoked — ${societyName}`,
      });
      const header = i18n.t("email.tenancy_revoked_header", {
        lng,
        defaultValue: "Tenancy Revoked",
      });
      const greeting = i18n.t("email.welcome_greeting", {
        lng,
        name: tenantName,
        defaultValue: `Hello ${tenantName},`,
      });
      const body = i18n.t("email.tenancy_revoked_body", {
        lng,
        unitName,
        societyName,
        defaultValue: `This is to inform you that your tenancy for unit ${unitName} at ${societyName} has been ended by the apartment owner.`,
      });
      const note = i18n.t("email.tenancy_revoked_deactivated", {
        lng,
        societyName,
        defaultValue: `Your account access and active credentials for ${societyName} have been deactivated.`,
      });
      const footer = i18n.t("email.welcome_footer", {
        lng,
        defaultValue: "All rights reserved.",
      });

      this.emailService.sendEmail({
        to: tenantEmail,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
              <div style="background-color: #1a1f36; padding: 24px; text-align: center;">
                <h2 style="color: #ffffff; margin: 0; font-size: 22px;">${header}</h2>
              </div>
              <div style="padding: 30px;">
                <p style="font-size: 16px; margin-top: 0;">${greeting}</p>
                <p style="font-size: 15px; color: #555;">
                  ${body}
                </p>
                <p style="font-size: 14px; color: #666; margin-top: 15px;">
                  ${note}
                </p>
              </div>
              <div style="background-color: #f1f3f5; padding: 16px; text-align: center; font-size: 12px; color: #888;">
                <p style="margin: 0;">© ${new Date().getFullYear()} ${societyName}. ${footer}</p>
              </div>
            </div>
          </div>
        `,
      }).catch((err) => console.error("[RevokeTenancyUseCase] Failed to send revocation email:", err));
    }
  }

  private async notifyTenant(userId: number, apartmentId: number): Promise<void> {
    try {
      await notificationService.notify(
        userId,
        "tenancy_revoked",
        "Your tenancy has been ended",
        "The apartment owner has ended your tenancy. Your account access has been revoked.",
        {
          apartmentId,
          key: "notification.tenancy_revoked",
          params: {},
        }
      );
    } catch (error) {
      console.error("Failed to notify tenant of tenancy revocation", error);
    }
  }
}