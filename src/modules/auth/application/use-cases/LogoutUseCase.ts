import { CognitoAuthService } from "../../infrastructure/services/CognitoAuthService";

export class LogoutUseCase {
  constructor(
    private readonly cognitoAuthService: CognitoAuthService
  ) { }

  async execute(refreshToken?: string, accessToken?: string): Promise<void> {
    if (accessToken) {
      await this.cognitoAuthService.logout(accessToken);
    }

    if (refreshToken) {
      await this.cognitoAuthService.revokeToken(refreshToken);
    }
  }
}