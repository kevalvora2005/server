import crypto from "crypto";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ForgotPasswordDto } from "../dtos/ForgotPasswordDto";
import { IEmailService } from "../../domain/services/IEmailService";
import { otpStore } from "../../infrastructure/services/OtpStore";
import { buildPasswordResetEmailTemplate } from "../templates/passwordResetEmailTemplate";

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user || !user.isActive) return;

    const code = crypto.randomInt(100000, 999999).toString();

    otpStore.set(user.email, code);

    const { subject, html } = await buildPasswordResetEmailTemplate({
      name: user.name,
      code,
      preferredLanguage: user.preferredLanguage,
    });

    await this.emailService.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }
}
