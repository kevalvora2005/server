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
import { buildTenancyRevokedEmailTemplate } from "../templates/tenancyRevokedEmailTemplate";

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

      const { subject, html } = buildTenancyRevokedEmailTemplate({
        name: tenantName,
        unitName,
        preferredLanguage: tenantUser?.preferredLanguage,
      });

      this.emailService.sendEmail({
        to: tenantEmail,
        subject,
        html,
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