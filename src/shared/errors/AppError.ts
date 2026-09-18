export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode?: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, errorCode?: string) {
    super(message);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}