import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { CreateUserDto } from "../dtos/CreateUserDto";
import { User } from "../../domain/entities/User";
import { UserAlreadyExistsError } from "../../domain/errors/AuthErrors";
import { CognitoAuthService } from "../../infrastructure/services/CognitoAuthService";

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cognitoAuthService: CognitoAuthService
  ) {}

  async execute(dto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    const cognitoSub = await this.cognitoAuthService.adminCreateUser(
      dto.email,
      dto.name,
      dto.phone,
      dto.role,
      dto.password
    );

    const userInstance = User.create({
      cognitoSub,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
    });

    const savedUser = await this.userRepository.create(userInstance);

    return savedUser;
  }
}