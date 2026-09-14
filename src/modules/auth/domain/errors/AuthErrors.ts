import { AppError } from "../../../../shared/errors/AppError";

export class UserAlreadyExistsError extends AppError {
  constructor() {
    super("User already exists with this email", 409);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super("Invalid credentials", 401);
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super("Unauthorized", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("Access denied", 403);
  }
}

export class UserNotFoundError extends AppError {
  constructor() {
    super("User not found", 404);
  }
}

export class InactiveUserError extends AppError {
  constructor() {
    super("User account is inactive", 403);
  }
}

export class RefreshTokenNotFoundError extends AppError {
  constructor() {
    super("Refresh token not found", 401);
  }
}

export class InvalidRefreshTokenError extends AppError {
  constructor() {
    super("Invalid refresh token", 401);
  }
}

export class InvalidResetTokenError extends AppError {
  constructor() {
    super("Invalid or expired reset token", 400);
  }
}

export class ExpiredResetTokenError extends AppError {
  constructor() {
    super("Reset token has expired. Please request a new one.", 400);
  }
}

export { AppError };
