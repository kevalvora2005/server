export interface ResetPasswordDto {
  email?: string;
  code?: string;
  token?: string;
  newPassword: string;
}