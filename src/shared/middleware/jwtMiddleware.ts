import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";
import { ApiResponse } from "../utils/apiResponse";
import { CognitoTokenVerifier } from "../../modules/auth/infrastructure/services/CognitoTokenVerifier";
import { UserRepository } from "../../modules/auth/infrastructure/repositories/UserRepository";

const cognitoVerifier = new CognitoTokenVerifier();
const userRepository = new UserRepository();

export const jwtMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json(
        ApiResponse.error("Access token is required")
      );
      return;
    }

    const token = authHeader.split(" ")[1];

    const cognitoPayload = await cognitoVerifier.verifyToken(token);

    if (!cognitoPayload) {
      res.status(401).json(
        ApiResponse.error("Invalid or expired session token.")
      );
      return;
    }

    const cognitoSub = cognitoPayload.sub;
    let user = await userRepository.findByCognitoSub(cognitoSub);

    if (!user && cognitoPayload.email) {
      user = await userRepository.findByEmail(cognitoPayload.email);
      if (user) {
        user.setCognitoSub(cognitoSub);
        await userRepository.update(user);
      }
    } else if (!user && cognitoPayload.username) {
      user = await userRepository.findByEmail(cognitoPayload.username);
      if (user) {
        user.setCognitoSub(cognitoSub);
        await userRepository.update(user);
      }
    }

    if (!user || !user.isActive) {
      res.status(401).json(
        ApiResponse.error("User account not found or deactivated.")
      );
      return;
    }

    const roleFromGroup = cognitoPayload.groups && cognitoPayload.groups.length > 0 
      ? (cognitoPayload.groups[0] as any) 
      : user.role;

    (req as AuthenticatedRequest).user = {
      userId: user.id!,
      cognitoSub: cognitoSub,
      email: user.email,
      role: roleFromGroup || user.role,
      mustResetPassword: user.mustResetPassword,
      preferredLanguage: user.preferredLanguage,
      locale: user.locale,
    };

    (req as AuthenticatedRequest).language = user.preferredLanguage || "en";

    if (user.mustResetPassword) {
      res.status(403).json(
        ApiResponse.error("Password reset required before accessing this resource.")
      );
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};