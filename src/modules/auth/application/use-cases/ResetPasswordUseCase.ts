import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IPasswordResetTokenRepository } from "../../domain/repositories/IPasswordResetTokenRepository";
import { ResetPasswordDto } from "../dtos/ResetPasswordDto";
import { ExpiredResetTokenError, InvalidResetTokenError, UserNotFoundError } from "../../domain/errors/AuthErrors";
import { UserResponseDto } from "../dtos/UserResponseDto";
import { IResidentRepository } from "../../../residents/domain/repositories/IResidentRepository";
import { CognitoAuthService } from "../../infrastructure/services/CognitoAuthService";

export interface ResetPasswordResult {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly cognitoAuthService: CognitoAuthService,
    private readonly residentRepository?: IResidentRepository
  ) { }

  async execute(dto: ResetPasswordDto): Promise<ResetPasswordResult> {
    const tokenEntity = await this.passwordResetTokenRepository.findByToken(dto.token);

    if (!tokenEntity) {
      throw new InvalidResetTokenError();
    }

    if (tokenEntity.isExpired()) {
      await this.passwordResetTokenRepository.deleteByToken(dto.token);
      throw new ExpiredResetTokenError();
    }

    const user = await this.userRepository.findById(tokenEntity.userId);
    if (!user || !user.isActive) {
      throw new UserNotFoundError();
    }

    await this.cognitoAuthService.adminSetUserPassword(user.email, dto.newPassword);

    user.clearPasswordReset();
    const updatedUser = await this.userRepository.update(user);

    await this.passwordResetTokenRepository.deleteByToken(dto.token);

    const tokens = await this.cognitoAuthService.login(user.email, dto.newPassword);

    let resident = null;
    if (this.residentRepository && updatedUser.id) {
      resident = await this.residentRepository.findByUserId(updatedUser.id);
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        ...updatedUser.toResponseObject(),
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