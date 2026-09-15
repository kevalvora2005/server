import { LoginDto } from "../dtos/LoginDto";
import { AuthResponseDto } from "../dtos/AuthResponseDto";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UserRole } from "../../domain/entities/User";
import {
  InvalidCredentialsError,
  InactiveUserError,
} from "../../domain/errors/AuthErrors";
import { CognitoAuthService } from "../../infrastructure/services/CognitoAuthService";
import { IResidentRepository } from "../../../residents/domain/repositories/IResidentRepository";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cognitoAuthService: CognitoAuthService,
    private readonly residentRepository?: IResidentRepository
  ) { }


  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    const isEmail = EMAIL_PATTERN.test(dto.identifier);

    const user = isEmail
      ? await this.userRepository.findByEmail(dto.identifier)
      : await this.userRepository.findByPhone(dto.identifier);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!isEmail && user.role !== UserRole.RESIDENT) {
      throw new InvalidCredentialsError();
    }

    if (!user.isActive) {
      throw new InactiveUserError();
    }

    let tokens;
    try {
      tokens = await this.cognitoAuthService.login(user.email, dto.password);
    } catch (error) {
      throw new InvalidCredentialsError();
    }

    if (user.mustResetPassword && user.id) {
      try {
        await this.cognitoAuthService.forgotPassword(user.email);
      } catch (err) {}
    }

    let resident = null;
    if (this.residentRepository && user.id) {
      resident = await this.residentRepository.findByUserId(user.id);
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        ...user.toResponseObject(),
        residentId: resident?.id ?? null,
        resident: resident
          ? {
            id: resident.id!,
            isOwner: resident.isOwner,
            isOccupant: resident.isOccupant,
            moveInDate: resident.moveInDate,
            apartmentId: resident.apartmentId,
          }
          : null,
      },
    };
  }
}