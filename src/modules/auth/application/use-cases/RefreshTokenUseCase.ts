import { AuthResponseDto } from "../dtos/AuthResponseDto";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { CognitoAuthService } from "../../infrastructure/services/CognitoAuthService";
import { CognitoTokenVerifier } from "../../infrastructure/services/CognitoTokenVerifier";
import {
  InvalidRefreshTokenError,
  UserNotFoundError,
} from "../../domain/errors/AuthErrors";

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cognitoAuthService: CognitoAuthService,
    private readonly tokenVerifier: CognitoTokenVerifier = new CognitoTokenVerifier()
  ) { }

  async execute(refreshToken: string): Promise<AuthResponseDto> {
    if (!refreshToken) {
      throw new InvalidRefreshTokenError();
    }

    try {
      const freshTokens = await this.cognitoAuthService.refreshSession(refreshToken);

      const payload = await this.tokenVerifier.verifyToken(freshTokens.accessToken);

      if (!payload?.sub) {
        throw new InvalidRefreshTokenError();
      }

      const user = await this.userRepository.findByCognitoSub(payload.sub);

      if (!user) {
        throw new UserNotFoundError();
      }

      if (!user.isActive) {
        throw new InvalidRefreshTokenError();
      }

      return {
        accessToken: freshTokens.accessToken,
        refreshToken: refreshToken,
        user: user.toResponseObject(),
      };
    } catch (error) {
      throw new InvalidRefreshTokenError();
    }
  }
}