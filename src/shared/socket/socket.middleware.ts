import { Socket } from "socket.io";
import { CognitoTokenVerifier } from "../../modules/auth/infrastructure/services/CognitoTokenVerifier";
import { UserRepository } from "../../modules/auth/infrastructure/repositories/UserRepository";

export interface AuthenticatedSocket extends Socket {
  user?: {
    userId: number;
    role: string;
    cognitoSub?: string;
  };
}

const cognitoVerifier = new CognitoTokenVerifier();
const userRepository = new UserRepository();

export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  const authSocket = socket as AuthenticatedSocket;
  let token = authSocket.handshake.auth?.token;

  if (!token) {
    return next(new Error("No token provided"));
  }

  if (typeof token === "string" && token.startsWith("Bearer ")) {
    token = token.slice(7).trim();
  }

  try {
    const cognitoPayload = await cognitoVerifier.verifyToken(token);

    if (!cognitoPayload) {
      return next(new Error("Authentication failed: Invalid or expired token"));
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
      return next(new Error("Authentication failed: User inactive or not found"));
    }

    const role = cognitoPayload.groups?.[0] || user.role;

    authSocket.user = {
      userId: user.id!,
      role: role,
      cognitoSub: cognitoSub,
    };

    return next();
  } catch (error) {
    return next(new Error("Authentication failed"));
  }
}