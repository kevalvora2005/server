import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ForgotPasswordDto } from "../dtos/ForgotPasswordDto";
import { CognitoAuthService } from "../../infrastructure/services/CognitoAuthService";

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cognitoAuthService: CognitoAuthService
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user || !user.isActive) {
      return;
    }

    await this.cognitoAuthService.forgotPassword(user.email);
  }
}