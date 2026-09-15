import { UserRepository } from "./infrastructure/repositories/UserRepository";
import { NodemailerEmailService } from "./infrastructure/services/NodemailerEmailService";
import { CognitoAuthService } from "./infrastructure/services/CognitoAuthService";
import { CreateUserUseCase } from "./application/use-cases/CreateUserUseCase";
import { LoginUseCase } from "./application/use-cases/LoginUseCase";
import { RefreshTokenUseCase } from "./application/use-cases/RefreshTokenUseCase";
import { LogoutUseCase } from "./application/use-cases/LogoutUseCase";
import { GetCurrentUserUseCase } from "./application/use-cases/GetCurrentUserUseCase";
import { ForgotPasswordUseCase } from "./application/use-cases/ForgotPasswordUseCase";
import { ResetPasswordUseCase } from "./application/use-cases/ResetPasswordUseCase";
import { AuthController } from "./presentation/controllers/authController";
import { UpdateProfileUseCase } from "./application/use-cases/UpdateProfileUseCase";
import { ChangePasswordUseCase } from "./application/use-cases/ChangePasswordUseCase";
import { ResidentRepository } from "../residents/infrastructure/repositories/ResidentRepository";

const userRepository = new UserRepository();
const residentRepository = new ResidentRepository();
const emailService = new NodemailerEmailService();
const cognitoAuthService = new CognitoAuthService();

const createUserUseCase = new CreateUserUseCase(userRepository, cognitoAuthService);
const loginUseCase = new LoginUseCase(userRepository, cognitoAuthService, residentRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, cognitoAuthService, residentRepository);
const logoutUseCase = new LogoutUseCase(cognitoAuthService);
const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository, residentRepository);
const forgotPasswordUseCase = new ForgotPasswordUseCase(userRepository, cognitoAuthService);
const resetPasswordUseCase = new ResetPasswordUseCase(
  userRepository,
  cognitoAuthService,
  residentRepository
);
const updateProfileUseCase = new UpdateProfileUseCase(userRepository);
const changePasswordUseCase = new ChangePasswordUseCase(userRepository, cognitoAuthService);

export const authController = new AuthController(
  createUserUseCase,
  loginUseCase,
  refreshTokenUseCase,
  logoutUseCase,
  getCurrentUserUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase,
  updateProfileUseCase,
  changePasswordUseCase,
);