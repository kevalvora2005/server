import { ApartmentModel } from "../../../apartments/infrastructure/models/ApartmentModel";
import { IEmailService } from "../../../auth/domain/services/IEmailService";
import { IResidentRepository } from "../../domain/repositories/IResidentRepository";
import { IUserRepository } from "../../../auth/domain/repositories/IUserRepository";
import { CreateResidentDto } from "../dtos/CreateResidentDto";
import { Resident } from "../../domain/entities/Resident";
import { User, UserRole } from "../../../auth/domain/entities/User";
import { UserAlreadyExistsError } from "../../../auth/domain/errors/AuthErrors";
import { ApartmentAlreadyOccupiedError } from "../../domain/errors/ResidentErrors";
import { buildWelcomeEmailTemplate } from "../templates/welcomeEmailTemplate";
import { generateRandomPassword } from "../../../../shared/utils/generateRandomPassword";
import { CognitoAuthService } from "../../../auth/infrastructure/services/CognitoAuthService";

export class CreateResidentUseCase {
  constructor(
    private readonly residentRepository: IResidentRepository,
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
    private readonly cognitoAuthService: CognitoAuthService
  ) { }

  async execute(dto: CreateResidentDto): Promise<Resident> {
    let apartment: ApartmentModel | null = null;
    if (dto.apartmentId) {
      apartment = await ApartmentModel.findByPk(dto.apartmentId);
      if (!apartment) {
        throw new Error("Selected apartment unit does not exist in database");
      }

      const existingActiveResident = await this.residentRepository.findActiveByApartmentId(dto.apartmentId);
      if (existingActiveResident) {
        throw new ApartmentAlreadyOccupiedError();
      }
    }

    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser && existingUser.isActive) {
      throw new UserAlreadyExistsError();
    }

    const rawPassword = dto.password || generateRandomPassword(11);

    let cognitoSub: string | undefined = existingUser?.cognitoSub || undefined;
    if (!cognitoSub) {
      try {
        cognitoSub = await this.cognitoAuthService.adminCreateUser(
          dto.email,
          dto.name,
          dto.phone,
          UserRole.RESIDENT,
          rawPassword
        );
      } catch (error: any) {
        if (error.message?.includes("already exists") || error.statusCode === 409) {
          throw new UserAlreadyExistsError();
        }
        throw error;
      }
    }

    let savedUser: User;

    if (existingUser && !existingUser.isActive) {
      existingUser.updateName(dto.name);
      existingUser.updatePhone(dto.phone);
      if (cognitoSub) existingUser.setCognitoSub(cognitoSub);
      existingUser.reactivate();
      existingUser.requirePasswordReset();
      savedUser = await this.userRepository.update(existingUser);
    } else {
      const userInstance = User.create({
        cognitoSub,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: UserRole.RESIDENT,
        mustResetPassword: true,
      });
      savedUser = await this.userRepository.create(userInstance);
    }

    const residentInstance = Resident.create({
      userId: savedUser.id!,
      apartmentId: dto.apartmentId,
      isOwner: dto.isOwner ?? true,
      moveInDate: new Date(),
    });
    const savedResident = await this.residentRepository.create(residentInstance);

    let unitName = "Your Apartment";
    if (apartment) {
      unitName = `${apartment.block}-${apartment.floorNumber}${apartment.unitNumber}`;
    }

    if (this.emailService && savedUser.id) {
      const { subject, html } = await buildWelcomeEmailTemplate({
        name: dto.name,
        email: dto.email,
        unitName,
        temporaryPassword: rawPassword,
        preferredLanguage: dto.preferredLanguage,
      });

      this.emailService.sendEmail({
        to: dto.email,
        subject,
        html,
      }).catch((err) => console.error("[CreateResidentUseCase] Welcome email delivery error:", err));
    }

    return savedResident;
  }
}