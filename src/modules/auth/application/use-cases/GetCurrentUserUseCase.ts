import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IResidentRepository } from "../../../residents/domain/repositories/IResidentRepository";
import { UserResponseDto } from "../dtos/UserResponseDto";
import { UserNotFoundError, InactiveUserError } from "../../domain/errors/AuthErrors";

export class GetCurrentUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly residentRepository: IResidentRepository,
  ) { }

  async execute(userId: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError();
    if (!user.isActive) throw new InactiveUserError();

    const resident = await this.residentRepository.findByUserId(userId);

    return {
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
    };
  }
}