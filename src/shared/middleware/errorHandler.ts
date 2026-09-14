import { Request, Response, NextFunction } from "express";
import { AppError } from "../../modules/auth/domain/errors/AuthErrors";
import { ApiResponse } from "../utils/apiResponse";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {

  console.error(`[Error Handler Triggered]:`, error);

  if (error.name === "TokenExpiredError") {
    res.status(401).json(ApiResponse.error("Session expired. Please log in again."));
    return;
  }

  if (error.name === "JsonWebTokenError") {
    res.status(401).json(ApiResponse.error("Invalid token."));
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json(ApiResponse.error(error.message));
    return;
  }

  // Handle any domain error that defines a custom statusCode property
  const customError = error as Error & { statusCode?: unknown };
  if (typeof customError.statusCode === "number") {
    res.status(customError.statusCode).json(ApiResponse.error(error.message));
    return;
  }

  // Domain errors mapped by class name to prevent circular imports
  if (
    error.name === "ComplaintNotFoundError" ||
    error.name === "InvoiceNotFoundError" ||
    error.name === "MaintenanceSettingNotFoundError"
  ) {
    res.status(404).json(ApiResponse.error(error.message));
    return;
  }

  if (
    error.name === "UnauthorizedComplaintAccessError" ||
    error.name === "UnauthorizedInvoiceAccessError"
  ) {
    res.status(403).json(ApiResponse.error(error.message));
    return;
  }

  if (
    error.name === "ComplaintAlreadyResolvedError" ||
    error.name === "InvalidStatusTransitionError" ||
    error.name === "ComplaintCannotBeDeletedError" ||
    error.name === "InvoiceAlreadyPaidError" ||
    error.name === "InvalidPaymentAmountError" ||
    error.name === "InvalidChequeNumberError" ||
    error.name === "InvalidUpiRefError" ||
    error.name === "OnlyUpiPaymentAllowedError"
  ) {
    res.status(400).json(ApiResponse.error(error.message));
    return;
  }

   const message = error.message || "Internal Server Error";
   res.status(500).json(ApiResponse.error(message));
};