import { UpdateProfileDto } from "../dtos/UpdateProfileDto";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { AppError } from "../../../../shared/errors/AppError";

export class UpdateProfileUseCase {
  constructor(private userRepository: IUserRepository) { }

  async execute(userId: number, dto: UpdateProfileDto): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 404);
    }

    if (dto.name) {
      user.updateName(dto.name);
    }
    if (dto.phone) {
      user.updatePhone(dto.phone);
    }
    if (dto.preferredLanguage || dto.locale) {
      user.updateLanguageAndLocale(dto.preferredLanguage, dto.locale);
    }

    await this.userRepository.update(user);
  }
}