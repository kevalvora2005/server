import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  GlobalSignOutCommand,
  RevokeTokenCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { env } from "../../../../shared/config/env";
import { AppError } from "../../../../shared/errors/AppError";

export interface CognitoTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export class CognitoAuthService {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor() {
    this.userPoolId = env.COGNITO_USER_POOL_ID;
    this.clientId = env.COGNITO_CLIENT_ID;

    const clientConfig: any = {
      region: env.AWS_REGION,
    };

    if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
      clientConfig.credentials = {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      };
    }

    this.client = new CognitoIdentityProviderClient(clientConfig);
  }

  async login(email: string, password: string): Promise<CognitoTokens> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await this.client.send(command);

      if (response.ChallengeName) {
        if (response.ChallengeName === "NEW_PASSWORD_REQUIRED") {
          const challengeCommand = new RespondToAuthChallengeCommand({
            ChallengeName: "NEW_PASSWORD_REQUIRED",
            ClientId: this.clientId,
            Session: response.Session,
            ChallengeResponses: {
              USERNAME: email,
              NEW_PASSWORD: password,
            },
          });

          const challengeRes = await this.client.send(challengeCommand);
          const challengeResult = challengeRes.AuthenticationResult;

          if (!challengeResult || !challengeResult.AccessToken || !challengeResult.IdToken || !challengeResult.RefreshToken) {
            throw new AppError("Failed to complete password setup with identity provider", 401);
          }

          return {
            accessToken: challengeResult.AccessToken,
            idToken: challengeResult.IdToken,
            refreshToken: challengeResult.RefreshToken,
            expiresIn: challengeResult.ExpiresIn,
          };
        }
        throw new AppError(`Authentication challenge required: ${response.ChallengeName}`, 403);
      }

      const result = response.AuthenticationResult;
      if (!result || !result.AccessToken || !result.IdToken || !result.RefreshToken) {
        throw new AppError("Authentication failed: Incomplete tokens returned by identity provider", 401);
      }

      return {
        accessToken: result.AccessToken,
        idToken: result.IdToken,
        refreshToken: result.RefreshToken,
        expiresIn: result.ExpiresIn,
      };
    } catch (error: any) {
      throw new AppError(error.message || "Invalid credentials", 401);
    }
  }

  async refreshSession(refreshToken: string): Promise<CognitoTokens> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const response = await this.client.send(command);
      const result = response.AuthenticationResult;

      if (!result || !result.AccessToken || !result.IdToken) {
        throw new AppError("Unable to refresh token", 401);
      }

      return {
        accessToken: result.AccessToken,
        idToken: result.IdToken,
        refreshToken: refreshToken,
        expiresIn: result.ExpiresIn,
      };
    } catch (error: any) {
      throw new AppError(error.message || "Session refresh failed or token expired", 401);
    }
  }

  async adminCreateUser(
    email: string,
    name: string,
    phone: string,
    role: string,
    password: string
  ): Promise<string> {
    try {
      const createCommand = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        TemporaryPassword: password,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "name", Value: name },
          { Name: "email_verified", Value: "true" },
        ],
        MessageAction: "SUPPRESS",
      });

      const createRes = await this.client.send(createCommand);
      const cognitoSub = createRes.User?.Attributes?.find((a) => a.Name === "sub")?.Value;

      if (!cognitoSub) {
        throw new AppError("Failed to retrieve user ID (sub) from Cognito", 500);
      }

      try {
        await this.client.send(
          new AdminAddUserToGroupCommand({
            UserPoolId: this.userPoolId,
            Username: email,
            GroupName: role,
          })
        );
      } catch {
      }

      return cognitoSub;
    } catch (error: any) {
      if (error.name === "UsernameExistsException") {
        throw new AppError("User already exists with this email", 409);
      }
      throw new AppError(error.message || "Failed to create user in identity provider", 400);
    }
  }

  async adminSetUserPassword(email: string, password: string): Promise<void> {
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: this.userPoolId,
      Username: email,
      Password: password,
      Permanent: true,
    });
    await this.client.send(command);
  }

  async adminGetUser(email: string): Promise<string | null> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
      });
      const res = await this.client.send(command);
      return res.UserAttributes?.find((a) => a.Name === "sub")?.Value || null;
    } catch {
      return null;
    }
  }

  async logout(accessToken: string): Promise<void> {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });
      await this.client.send(command);
    } catch {
    }
  }

  async revokeToken(refreshToken: string): Promise<void> {
    try {
      const command = new RevokeTokenCommand({
        ClientId: this.clientId,
        Token: refreshToken,
      });
      await this.client.send(command);
    } catch {
    }
  }
}
