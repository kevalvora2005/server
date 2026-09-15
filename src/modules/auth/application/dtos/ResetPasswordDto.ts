export interface ResetPasswordDto {
  email?: string;
  code?: string;
  confirmationCode?: string;
  token?: string;
  newPassword: string;
}