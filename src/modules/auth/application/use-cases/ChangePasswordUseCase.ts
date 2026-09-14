import { ChangePasswordDto } from "../dtos/ChangePasswordDto";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { AppError } from "../../../../shared/errors/AppError";
import { CognitoAuthService } from "../../infrastructure/services/CognitoAuthService";

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cognitoAuthService: CognitoAuthService
  ) { }

  async execute(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 404);
    }

    try {
      await this.cognitoAuthService.login(user.email, dto.currentPassword);
    } catch (error) {
      throw new AppError("Current password is incorrect", 400);
    }

    await this.cognitoAuthService.adminSetUserPassword(user.email, dto.newPassword);

    user.clearPasswordReset();

    await this.userRepository.update(user);
  }
}