import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ResetPasswordDto } from "../dtos/ResetPasswordDto";
import { UserNotFoundError } from "../../domain/errors/AuthErrors";
import { UserResponseDto } from "../dtos/UserResponseDto";
import { IResidentRepository } from "../../../residents/domain/repositories/IResidentRepository";
import { CognitoAuthService } from "../../infrastructure/services/CognitoAuthService";
import { User } from "../../domain/entities/User";

export interface ResetPasswordResult {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cognitoAuthService: CognitoAuthService,
    private readonly residentRepository?: IResidentRepository
  ) { }

  async execute(dto: ResetPasswordDto): Promise<ResetPasswordResult> {
    let user = await this.userRepository.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UserNotFoundError();
    }

    await this.cognitoAuthService.confirmForgotPassword(dto.email, dto.code, dto.newPassword);

    if (user.mustResetPassword) {
      user.clearPasswordReset();
      user = await this.userRepository.update(user);
    }

    const tokens = await this.cognitoAuthService.login(user.email, dto.newPassword);

    let resident = null;
    if (this.residentRepository && user.id) {
      resident = await this.residentRepository.findByUserId(user.id);
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        ...user.toResponseObject(),
        residentId: resident?.id ?? null,
        resident: resident
          ? {
            id: resident.id!,
            isOwner: resident.isOwner,
            isOccupant: resident.isOccupant,
            moveInDate: resident.moveInDate,
            apartmentId: resident.apartmentId,
          }
          : null,
      },
    };
  }
}