import { TenantRequest } from "../../domain/entities/TenantRequest";
import { ITenantRequestRepository } from "../../domain/repositories/ITenantRequestRepository";
import { IResidentRepository } from "../../../residents/domain/repositories/IResidentRepository";
import { IUserRepository } from "../../../auth/domain/repositories/IUserRepository";
import { UserRole } from "../../../auth/domain/entities/User";
import { notificationService } from "../../../notifications/container";
import { SubmitTenantRequestDto } from "../dtos/SubmitTenantRequestDto";
import { ApartmentAlreadyHasActiveTenantError } from "../../domain/errors/TenantRequestErrors";

export class SubmitTenantRequestUseCase {
  constructor(
    private readonly tenantRequestRepository: ITenantRequestRepository,
    private readonly residentRepository: IResidentRepository,
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(dto: SubmitTenantRequestDto): Promise<TenantRequest> {
    const existingTenant = await this.residentRepository.findActiveTenantByApartmentId(dto.apartmentId);
    if (existingTenant) {
      throw new ApartmentAlreadyHasActiveTenantError();
    }

    const existingPending = await this.tenantRequestRepository.findPendingByApartmentId(dto.apartmentId);
    if (existingPending) {
      throw new ApartmentAlreadyHasActiveTenantError();
    }

    const request = TenantRequest.create({
      apartmentId: dto.apartmentId,
      requestedBy: dto.requestedBy,
      tenantName: dto.tenantName,
      tenantEmail: dto.tenantEmail,
      tenantPhone: dto.tenantPhone,
      moveInDate: dto.moveInDate,
    });

    const saved = await this.tenantRequestRepository.create(request);

    await this.notifyAdmins(saved);

    return saved;
  }

  private async notifyAdmins(request: TenantRequest): Promise<void> {
    try {
      const admins = await this.userRepository.findAllByRole(UserRole.ADMIN);

      await Promise.all(
        admins.map((admin) =>
          notificationService.notify(
            admin.id!,
            "tenant_request_submitted",
            "New tenant request",
            `${request.tenantName} has been proposed as a tenant. Review and record committee votes.`,
            {
              tenantRequestId: request.id,
              key: "notification.tenant_request_submitted",
              params: { tenantName: request.tenantName },
            }
          )
        )
      );
    } catch (error) {
      console.error("Failed to notify admins of new tenant request", error);
    }
  }
}