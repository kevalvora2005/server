import { TenantRequest } from "../../domain/entities/TenantRequest";
import { ITenantRequestRepository } from "../../domain/repositories/ITenantRequestRepository";
import { ITenantRequestVoteRepository } from "../../domain/repositories/ITenantRequestVoteRepository";
import { IUserRepository } from "../../../auth/domain/repositories/IUserRepository";
import { IEmailService } from "../../../auth/domain/services/IEmailService";
import { User, UserRole } from "../../../auth/domain/entities/User";
import { FinalizeTenantRequestDto } from "../dtos/FinalizeTenantRequestDto";
import {
  TenantRequestNotFoundError,
  TenantRequestAlreadyDecidedError,
  VotingNotCompleteError,
} from "../../domain/errors/TenantRequestErrors";
import { Resident } from "../../../residents/domain/entities/Resident";
import { IResidentRepository } from "../../../residents/domain/repositories/IResidentRepository";
import { notificationService } from "../../../notifications/container";
import { VotingEngine } from "../../../../shared/voting";
import { buildWelcomeEmailTemplate } from "../../../residents/application/templates/welcomeEmailTemplate";
import { ApartmentModel } from "../../../apartments/infrastructure/models/ApartmentModel";
import { generateRandomPassword } from "../../../../shared/utils/generateRandomPassword";
import { CognitoAuthService } from "../../../auth/infrastructure/services/CognitoAuthService";
import { AppError } from "../../../../shared/errors/AppError";

export interface FinalizeResult {
  request: TenantRequest;
  approved: boolean;
  newResident?: Resident;
}

export class FinalizeTenantRequestUseCase {
  constructor(
    private readonly tenantRequestRepository: ITenantRequestRepository,
    private readonly tenantRequestVoteRepository: ITenantRequestVoteRepository,
    private readonly residentRepository: IResidentRepository,
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
    private readonly cognitoAuthService: CognitoAuthService
  ) { }

  async execute(dto: FinalizeTenantRequestDto): Promise<FinalizeResult> {
    const request = await this.tenantRequestRepository.findById(dto.tenantRequestId);
    if (!request) {
      throw new TenantRequestNotFoundError(dto.tenantRequestId);
    }

    if (!request.isPending()) {
      throw new TenantRequestAlreadyDecidedError();
    }

    const owner = await this.residentRepository.findById(request.requestedBy);

    const [tally, committeeMembers, adminTally] = await Promise.all([
      this.tenantRequestVoteRepository.countByRequestId(dto.tenantRequestId),
      this.residentRepository.findCommitteeMembers(),
      this.tenantRequestVoteRepository.countAdminVotes(dto.tenantRequestId),
    ]);

    const totalCommitteeSize = committeeMembers.length;
    const adminVotes = adminTally.total;

    if (totalCommitteeSize === 0 && adminVotes === 0) {
      throw new VotingNotCompleteError();
    }

    const expectedVotes = totalCommitteeSize + (adminTally.total > 0 ? 1 : 0);
    const totalVotes = tally.total + adminVotes;

    if (totalVotes < expectedVotes) {
      throw new VotingNotCompleteError();
    }

    const outcome = VotingEngine.evaluateOutcomeFromCounts({
      committeeApprove: tally.approve,
      committeeReject: tally.reject,
      adminApprove: adminTally.approve,
      adminReject: adminTally.reject,
    });

    if (!outcome.isApproved) {
      request.reject();
      const updated = await this.tenantRequestRepository.update(request);

      if (owner) {
        await this.notifyOwner(
          owner.userId,
          request.id!,
          "tenant_request_rejected",
          "Tenant Request Rejected",
          "Your tenant request was rejected by the committee."
        );
      }

      return { request: updated, approved: false };
    }

    request.approve();
    const updatedRequest = await this.tenantRequestRepository.update(request);

    const rawPassword = generateRandomPassword(11);

    const existingUser = await this.userRepository.findByEmail(request.tenantEmail);
    let cognitoSub: string | undefined = existingUser?.cognitoSub || undefined;
    if (!cognitoSub) {
      try {
        cognitoSub = await this.cognitoAuthService.adminCreateUser(
          request.tenantEmail,
          request.tenantName,
          request.tenantPhone,
          UserRole.RESIDENT,
          rawPassword
        );
      } catch (error: any) {
        throw new AppError(error.message || "Failed to create user in identity provider", 400);
      }
    }

    let savedTenantUser: User;
    if (existingUser) {
      existingUser.updatePhone(request.tenantPhone);
      if (cognitoSub) existingUser.setCognitoSub(cognitoSub);
      existingUser.reactivate();
      existingUser.requirePasswordReset();
      savedTenantUser = await this.userRepository.update(existingUser);
    } else {
      const tenantUser = User.create({
        cognitoSub,
        name: request.tenantName,
        email: request.tenantEmail,
        phone: request.tenantPhone,
        role: UserRole.RESIDENT,
        mustResetPassword: true,
      });
      tenantUser.requirePasswordReset();
      savedTenantUser = await this.userRepository.create(tenantUser);
    }

    const existingResident = await this.residentRepository.findByUserId(savedTenantUser.id!);
    let savedTenantResident: Resident;
    if (existingResident) {
      existingResident.reactivate();
      existingResident.updateMoveInDate(request.moveInDate);
      existingResident.updateApartment(request.apartmentId);
      existingResident.updateIsOwner(false);
      existingResident.updateMoveOutDate(null);
      const moveInDateObj = new Date(request.moveInDate);
      if (moveInDateObj <= new Date()) {
        existingResident.markAsOccupant();
      } else {
        existingResident.markAsNonOccupant();
      }
      savedTenantResident = await this.residentRepository.update(existingResident);
    } else {
      const tenantResident = Resident.create({
        userId: savedTenantUser.id!,
        apartmentId: request.apartmentId,
        isOwner: false,
        moveInDate: request.moveInDate,
      });
      savedTenantResident = await this.residentRepository.create(tenantResident);
    }

    const moveInDateObj = new Date(request.moveInDate);
    if (moveInDateObj <= new Date() && savedTenantResident.id != null) {
      await this.residentRepository.clearApartmentOccupants(
        request.apartmentId,
        savedTenantResident.id
      );
    }

    if (owner) {
      await this.notifyOwner(
        owner.userId,
        request.id!,
        "tenant_request_approved",
        "Tenant Request Approved",
        "Your tenant request was approved. The tenant can now set up their account."
      );
    }

    let unitName = "Your Apartment";
    if (request.apartmentId) {
      const apartment = await ApartmentModel.findByPk(request.apartmentId);
      if (apartment) {
        unitName = `${apartment.block}-${apartment.floorNumber}${apartment.unitNumber}`;
      }
    }

    const { subject, html } = buildWelcomeEmailTemplate({
      name: request.tenantName,
      email: savedTenantUser.email,
      unitName,
      temporaryPassword: rawPassword,
    });

    await this.emailService.sendEmail({
      to: savedTenantUser.email,
      subject,
      html,
    });

    return {
      request: updatedRequest,
      approved: true,
      newResident: savedTenantResident,
    };
  }

  private async notifyOwner(
    userId: number,
    tenantRequestId: number,
    type: "tenant_request_approved" | "tenant_request_rejected",
    title: string,
    body: string
  ): Promise<void> {
    try {
      await notificationService.notify(userId, type, title, body, {
        tenantRequestId,
      });
    } catch (error) {
      console.error("Failed to send tenant request notification", error);
    }
  }
}