import { CognitoJwtVerifier } from "aws-jwt-verify";
import { env } from "../../../../shared/config/env";

export interface VerifiedTokenPayload {
  sub: string;
  email?: string;
  username?: string;
  groups?: string[];
  tokenUse: "access" | "id";
  [key: string]: any;
}

export class CognitoTokenVerifier {
  private accessVerifier: any;
  private idVerifier: any;

  constructor() {
    if (env.COGNITO_USER_POOL_ID && env.COGNITO_CLIENT_ID) {
      this.accessVerifier = CognitoJwtVerifier.create({
        userPoolId: env.COGNITO_USER_POOL_ID,
        tokenUse: "access",
        clientId: env.COGNITO_CLIENT_ID,
      });

      this.idVerifier = CognitoJwtVerifier.create({
        userPoolId: env.COGNITO_USER_POOL_ID,
        tokenUse: "id",
        clientId: env.COGNITO_CLIENT_ID,
      });
    }
  }

  async verifyToken(token: string): Promise<VerifiedTokenPayload | null> {
    if (this.accessVerifier) {
      try {
        const payload = await this.accessVerifier.verify(token);
        return {
          ...payload,
          sub: payload.sub,
          username: (payload.username as string) || (payload["cognito:username"] as string),
          email: payload.email as string | undefined,
          groups: (payload["cognito:groups"] as string[]) || [],
          tokenUse: "access",
        };
      } catch (err: any) {
        console.debug("[CognitoAuthService] access token verification failed:", err.message);
      }
    }

    if (this.idVerifier) {
      try {
        const payload = await this.idVerifier.verify(token);
        return {
          ...payload,
          sub: payload.sub,
          username: (payload.username as string) || (payload["cognito:username"] as string),
          email: payload.email as string | undefined,
          groups: (payload["cognito:groups"] as string[]) || [],
          tokenUse: "id",
        };
      } catch (err: any) {
        console.debug("[CognitoAuthService] id token verification failed:", err.message);
      }
    }

    return null;
  }
}
