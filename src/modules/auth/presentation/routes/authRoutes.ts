import { Router } from "express";

import { authController } from "../../container";

import { jwtMiddleware } from "../../../../shared/middleware/jwtMiddleware";

import { rbacMiddleware } from "../../../../shared/middleware/rbacMiddleware";
import { UserRole } from "../../domain/entities/User";
import {
  validateChangePassword,
  validateForgotPassword,
  validateLogin,
  validateRefreshToken,
  validateRegister,
  validateResetPassword,
  validateUpdateProfile,
} from '../validators/authValidators';

const router = Router();

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/login",
  validateLogin,
  authController.login
);

router.post(
  "/refresh",
  validateRefreshToken,
  authController.refreshToken
);

router.post(
  "/logout",
  validateRefreshToken,
  authController.logout
);

/*
|--------------------------------------------------------------------------
| Password Reset Routes (Public)
|--------------------------------------------------------------------------
*/

router.post(
  "/forgot-password",
  validateForgotPassword,
  authController.forgotPassword
);

router.post(
  "/reset-password",
  validateResetPassword,
  authController.resetPassword
);

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  jwtMiddleware,
  authController.me
);

router.put(
  "/me",
  jwtMiddleware,
  validateUpdateProfile,
  authController.updateProfile
);

router.put(
  "/me/password",
  jwtMiddleware,
  validateChangePassword,
  authController.changePassword
);

/*
|--------------------------------------------------------------------------
| Admin Only
|--------------------------------------------------------------------------
*/

router.post(
  "/users",
  jwtMiddleware,
  rbacMiddleware(UserRole.ADMIN),
  validateRegister,
  authController.createUser
);

export default router;