import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../../shared/types/AuthenticatedRequest";
import { CreateUserUseCase } from "../../application/use-cases/CreateUserUseCase";
import { LoginUseCase } from "../../application/use-cases/LoginUseCase";
import { RefreshTokenUseCase } from "../../application/use-cases/RefreshTokenUseCase";
import { LogoutUseCase } from "../../application/use-cases/LogoutUseCase";
import { GetCurrentUserUseCase } from "../../application/use-cases/GetCurrentUserUseCase";
import { ApiResponse } from "../../../../shared/utils/apiResponse";
import { ForgotPasswordUseCase } from "../../application/use-cases/ForgotPasswordUseCase";
import { ResetPasswordUseCase } from "../../application/use-cases/ResetPasswordUseCase";
import { UpdateProfileUseCase } from "../../application/use-cases/UpdateProfileUseCase";
import { ChangePasswordUseCase } from "../../application/use-cases/ChangePasswordUseCase";

export class AuthController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) { }

  createUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.createUserUseCase.execute(req.body);

      res.status(201).json(
        ApiResponse.success({
          message: "User created successfully",
          data: user.toResponseObject(),
        })
      );
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.loginUseCase.execute(req.body);

      res.status(200).json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const refreshToken = req.body.refreshToken;

      const result = await this.refreshTokenUseCase.execute(refreshToken);

      res.status(200).json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const refreshToken = req.body.refreshToken;
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : undefined;

      await this.logoutUseCase.execute(refreshToken, accessToken);

      res.status(200).json(
        ApiResponse.success({ message: "Logged out successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  me = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      const user = await this.getCurrentUserUseCase.execute(
        authReq.user.userId
      );
      res.status(200).json(ApiResponse.success(user));
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.forgotPasswordUseCase.execute(req.body);

      res.status(200).json(
        ApiResponse.success({
          message: "If an account exists with this email, a verification code has been sent.",
          data: null,
        })
      );
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.resetPasswordUseCase.execute(req.body);

      res.status(200).json(
        ApiResponse.success(result, "Password reset successfully.")
      );
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      await this.updateProfileUseCase.execute(authReq.user.userId, req.body);
      res.status(200).json(
        ApiResponse.success({ message: "Profile updated successfully", data: null })
      );
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      await this.changePasswordUseCase.execute(authReq.user.userId, req.body);
      res.status(200).json(
        ApiResponse.success({ message: "Password changed successfully", data: null })
      );
    } catch (error) {
      next(error);
    }
  };
}