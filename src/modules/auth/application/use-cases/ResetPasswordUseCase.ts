import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IPasswordResetTokenRepository } from "../../domain/repositories/IPasswordResetTokenRepository";
import { ResetPasswordDto } from "../dtos/ResetPasswordDto";
import { ExpiredResetTokenError, UserNotFoundError } from "../../domain/errors/AuthErrors";
import { UserResponseDto } from "../dtos/UserResponseDto";
import { IResidentRepository } from "../../../residents/domain/repositories/IResidentRepository";
import { CognitoAuthService } from "../../infrastructure/services/CognitoAuthService";
import { AppError } from "../../../../shared/errors/AppError";
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
    private readonly passwordResetTokenRepository?: IPasswordResetTokenRepository,
    private readonly residentRepository?: IResidentRepository
  ) { }

  async execute(dto: ResetPasswordDto): Promise<ResetPasswordResult> {
    if (!dto.code && !dto.token) {
      throw new AppError("Verification code or reset token is required", 400);
    }

    let user: User | null = null;

    if (this.passwordResetTokenRepository && dto.token) {
      const tokenEntity = await this.passwordResetTokenRepository.findByToken(dto.token);
      if (tokenEntity) {
        if (tokenEntity.isExpired()) {
          await this.passwordResetTokenRepository.deleteByToken(dto.token);
          throw new ExpiredResetTokenError();
        }

        user = await this.userRepository.findById(tokenEntity.userId);
        if (!user || !user.isActive) {
          throw new UserNotFoundError();
        }

        await this.cognitoAuthService.adminSetUserPassword(user.email, dto.newPassword);
        await this.passwordResetTokenRepository.deleteByToken(dto.token);
      }
    }

    if (!user) {
      const email = dto.email;
      if (!email) {
        throw new AppError("Email is required for password reset", 400);
      }

      if (!dto.code) {
        throw new AppError("Verification code is required", 400);
      }

      user = await this.userRepository.findByEmail(email);
      if (!user || !user.isActive) {
        throw new UserNotFoundError();
      }

      await this.cognitoAuthService.confirmForgotPassword(email, dto.code, dto.newPassword);
    }

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