import { Op } from "sequelize";
import { IResidentRepository, ListResidentsFilters, ResidentStats } from "../../domain/repositories/IResidentRepository";
import { Resident } from "../../domain/entities/Resident";
import { PaginatedResult, buildPaginatedResult } from "../../../../shared/types/Pagination";
import { ResidentModel } from "../models/ResidentModel";
import { UserModel } from "../../../auth/infrastructure/models/UserModel";
import { ApartmentModel } from "../../../apartments/infrastructure/models/ApartmentModel";

interface ResidentWithRelations extends ResidentModel {
  user?: UserModel | null;
  apartment?: ApartmentModel | null;
}

export class ResidentRepository implements IResidentRepository {

  private toEntity(model: ResidentModel): Resident {
    return new Resident({
      id: model.id,
      userId: model.userId,
      apartmentId: model.apartmentId,
      isOwner: model.isOwner,
      isCommitteeMember: model.isCommitteeMember,
      isOccupant: model.isOccupant,
      moveInDate: model.moveInDate,
      moveOutDate: model.moveOutDate,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  async create(resident: Resident): Promise<Resident> {
    const created = await ResidentModel.create({
      userId: resident.userId,
      apartmentId: resident.apartmentId,
      isOwner: resident.isOwner,
      isCommitteeMember: resident.isCommitteeMember,
      isOccupant: resident.isOccupant,
      moveInDate: resident.moveInDate,
      moveOutDate: resident.moveOutDate,
      isActive: resident.isActive,
    });

    return this.toEntity(created);
  }

  async findById(id: number): Promise<Resident | null> {
    const model = await ResidentModel.findByPk(id, {
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["id", "name", "email", "phone", "preferredLanguage", "locale"],
        },
        {
          model: ApartmentModel,
          as: "apartment",
          attributes: ["id", "block", "floorNumber", "unitNumber", "type"],
        },
      ],
    });

    if (!model) return null;

    const relModel = model as ResidentWithRelations;
    const resident = this.toEntity(model);
    resident.user = relModel.user ?? null;
    resident.apartment = relModel.apartment ?? null;
    return resident;
  }

  async findByUserId(userId: number): Promise<Resident | null> {
    const model = await ResidentModel.findOne({
      where: { userId },
      include: [
        { association: 'apartment' },
        { association: 'user' },
      ],
    });

    if (!model) return null;
    const relModel = model as ResidentWithRelations;
    const resident = this.toEntity(model);
    resident.user = relModel.user ?? null;
    resident.apartment = relModel.apartment ?? null;
    return resident;
  }

  async findAll(filters: ListResidentsFilters): Promise<PaginatedResult<Resident>> {

    const where: Record<string, unknown> = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.apartmentId) where.apartmentId = filters.apartmentId;
    if (filters.isOwner !== undefined) where.isOwner = filters.isOwner;

    const userWhere = filters.search
      ? {
        [Op.or]: [
          { name: { [Op.iLike]: `%${filters.search}%` } },
          { email: { [Op.iLike]: `%${filters.search}%` } },
        ],
      }
      : undefined;

    const offset = (filters.pageNumber - 1) * filters.pageSize;

    const { count, rows } = await ResidentModel.findAndCountAll({
      where,
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["id", "name", "email", "phone", "preferredLanguage", "locale"],
          where: userWhere,
          required: userWhere ? true : false,
        },
        {
          model: ApartmentModel,
          as: "apartment",
          attributes: ["id", "block", "floorNumber", "unitNumber", "type"],
          required: true,
        },
      ],
      limit: filters.pageSize,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return buildPaginatedResult(
      rows.map((row) => {
        const relRow = row as ResidentWithRelations;
        const resident = this.toEntity(row);
        resident.user = relRow.user ?? null;
        resident.apartment = relRow.apartment ?? null;
        return resident;
      }),
      count,
      filters.pageNumber,
      filters.pageSize
    );
  }

  async findAllActive(): Promise<Resident[]> {
    const rows = await ResidentModel.findAll({
      where: { isActive: true },
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["id", "name", "email", "phone", "preferredLanguage", "locale"],
        },
      ],
    });

    return rows.map((row) => {
      const relRow = row as ResidentWithRelations;
      const resident = this.toEntity(row);
      resident.user = relRow.user ?? null;
      return resident;
    });
  }

  async update(resident: Resident): Promise<Resident> {
    await ResidentModel.update(
      {
        apartmentId: resident.apartmentId,
        isOwner: resident.isOwner,
        isCommitteeMember: resident.isCommitteeMember,
        isOccupant: resident.isOccupant,
        moveInDate: resident.moveInDate,
        moveOutDate: resident.moveOutDate,
        isActive: resident.isActive,
        updatedAt: resident.updatedAt,
      },
      { where: { id: resident.id } }
    );
    const updated = await this.findById(resident.id!);
    return updated!;
  }

  async deactivate(id: number): Promise<void> {
    await ResidentModel.update(
      { isActive: false, isOccupant: false, moveOutDate: new Date() },
      { where: { id } }
    );
  }

  async findOwnerByApartmentId(apartmentId: number): Promise<Resident | null> {
    const model = await ResidentModel.findOne({
      where: { apartmentId, isOwner: true, isActive: true },
    });
    if (!model) return null;
    return this.toEntity(model);
  }

  async findActiveByApartmentId(apartmentId: number): Promise<Resident | null> {
    const model = await ResidentModel.findOne({
      where: { apartmentId, isActive: true },
    });
    if (!model) return null;
    return this.toEntity(model);
  }

  async findOccupantByApartmentId(apartmentId: number): Promise<Resident | null> {
    const model = await ResidentModel.findOne({
      where: { apartmentId, isOccupant: true, isActive: true },
    });
    if (!model) return null;
    return this.toEntity(model);
  }

  async findActiveTenantByApartmentId(apartmentId: number): Promise<Resident | null> {
    const model = await ResidentModel.findOne({
      where: { apartmentId, isActive: true, isOwner: false },
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["id", "name", "email", "phone", "preferredLanguage", "locale"],
        },
      ],
    });
    if (!model) return null;
    const relModel = model as ResidentWithRelations;
    const resident = this.toEntity(model);
    resident.user = relModel.user ?? null;
    return resident;
  }

  async findTenantsByApartmentId(apartmentId: number): Promise<Resident[]> {
    const rows = await ResidentModel.findAll({
      where: { apartmentId, isOwner: false },
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["id", "name", "email", "phone", "preferredLanguage", "locale"],
        },
      ],
      order: [["moveInDate", "DESC"]],
    });

    return rows.map((row) => {
      const relRow = row as ResidentWithRelations;
      const resident = this.toEntity(row);
      resident.user = relRow.user ?? null;
      return resident;
    });
  }

  async findActiveOccupantByApartmentId(apartmentId: number): Promise<Resident | null> {
    const model = await ResidentModel.findOne({
      where: { apartmentId, isActive: true, isOccupant: true },
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
    });

    if (!model) return null;
    const relModel = model as ResidentWithRelations;
    const resident = this.toEntity(model);
    resident.user = relModel.user ?? null;
    return resident;
  }

  async findCommitteeMembers(): Promise<Resident[]> {
    const rows = await ResidentModel.findAll({
      where: { isCommitteeMember: true, isActive: true },
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    return rows.map((row) => {
      const relRow = row as ResidentWithRelations;
      const resident = this.toEntity(row);
      resident.user = relRow.user ?? null;
      return resident;
    });
  }

  async getStats(): Promise<ResidentStats> {
    const [totalCount, totalActive, totalOwners, totalTenants] = await Promise.all([
      ResidentModel.count(),
      ResidentModel.count({ where: { isActive: true } }),
      ResidentModel.count({ where: { isOwner: true, isActive: true } }),
      ResidentModel.count({ where: { isOwner: false, isActive: true } }),
    ]);

    return { totalCount, totalActive, totalOwners, totalTenants };
  }

  async promoteDueOccupants(): Promise<number> {
    const now = new Date();

    const due = await ResidentModel.findAll({
      where: {
        isActive: true,
        isOwner: false,
        moveOutDate: null,
        isOccupant: false,
        moveInDate: { [Op.lte]: now },
      },
      attributes: ["id", "apartmentId"],
    });

    let changed = 0;

    for (const resident of due) {
      const [promoted] = await ResidentModel.update(
        { isOccupant: true },
        { where: { id: resident.id } }
      );
      changed += promoted;

      await this.clearApartmentOccupants(resident.apartmentId, resident.id);
    }

    return changed;
  }

  async clearApartmentOccupants(apartmentId: number, exceptResidentId?: number): Promise<number> {
    const where: Record<string, unknown> = {
      apartmentId,
      isActive: true,
      isOccupant: true,
    };
    if (exceptResidentId != null) {
      where.id = { [Op.ne]: exceptResidentId };
    }

    const [affectedCount] = await ResidentModel.update(
      { isOccupant: false },
      { where }
    );
    return affectedCount;
  }
}