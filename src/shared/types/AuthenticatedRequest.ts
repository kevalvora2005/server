import { Request } from "express";
import { UserRole } from "../../modules/auth/domain/entities/User";

export interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    cognitoSub?: string;
    email: string;
    role: UserRole;
    mustResetPassword: boolean;
    preferredLanguage: string;
    locale: string;
  };
  language?: string;
}