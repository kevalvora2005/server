export class ApiResponse<T = unknown> {
  static success<T>(
    data?: T,
    message = "Success"
  ) {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(
    message = "Error",
    errorCode?: string
  ) {
    return {
      success: false,
      message,
      errorCode,
      data: null,
    };
  }
}