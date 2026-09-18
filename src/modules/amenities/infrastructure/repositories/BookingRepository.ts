import { Op } from "sequelize";
import { IBookingRepository } from "../../domain/repositories/IBookingRepository";
import {
  Booking,
  BookingStatus,
  BookingResidentInfo,
  BookingApartmentInfo,
  BookingAmenityInfo,
} from "../../domain/entities/Booking";
import { PaginatedResult, buildPaginatedResult } from "../../../../shared/types/Pagination";
import { BookingModel } from "../models/BookingModel";
import { AmenityModel } from "../models/AmenityModel";
import { ResidentModel } from "../../../residents/infrastructure/models/ResidentModel";
import { UserModel } from "../../../auth/infrastructure/models/UserModel";
import { ApartmentModel } from "../../../apartments/infrastructure/models/ApartmentModel";

const bookingIncludes = [
  {
    model: AmenityModel,
    as: "amenity",
    attributes: ["id", "name", "price", "bookingType"],
  },
  {
    model: ResidentModel,
    as: "resident",
    include: [
      {
        model: UserModel,
        as: "user",
        attributes: ["id", "name", "email", "phone", "preferredLanguage", "locale"],
      },
      {
        model: ApartmentModel,
        as: "apartment",
        attributes: ["id", "block", "floorNumber", "unitNumber"],
      },
    ],
  },
  {
    model: ApartmentModel,
    as: "apartment",
    attributes: ["id", "block", "floorNumber", "unitNumber"],
  },
];

export class BookingRepository implements IBookingRepository {
  private toEntity(model: any): Booking {
    const rawRes = model.resident;
    const rawUser = rawRes?.user;
    const rawApt = model.apartment || rawRes?.apartment;
    const rawAmenity = model.amenity;

    const resident: BookingResidentInfo | null =
      rawRes && rawUser
        ? {
            id: rawRes.id,
            userId: rawRes.userId,
            name: rawUser.name,
            email: rawUser.email,
            phone: rawUser.phone,
            preferredLanguage: rawUser.preferredLanguage,
            locale: rawUser.locale,
          }
        : null;

    let unitFormatted = "";
    if (rawApt) {
      const floorStr =
        rawApt.floorNumber !== undefined && rawApt.floorNumber !== null
          ? String(rawApt.floorNumber)
          : "";
      const unitStr = String(rawApt.unitNumber || "");
      const fullUnit = unitStr.startsWith(floorStr)
        ? unitStr
        : `${floorStr}${unitStr}`;
      unitFormatted = `${rawApt.block}-${fullUnit}`;
    }

    const apartment: BookingApartmentInfo | null = rawApt
      ? {
          id: rawApt.id,
          block: rawApt.block,
          floorNumber: rawApt.floorNumber,
          unitNumber: rawApt.unitNumber,
          unitFormatted,
        }
      : null;

    const amenity: BookingAmenityInfo | null = rawAmenity
      ? {
          id: rawAmenity.id,
          name: rawAmenity.name,
          price: rawAmenity.price,
          bookingType: rawAmenity.bookingType,
          isSharedCapacity: rawAmenity.bookingType === "SHARED_CAPACITY",
        }
      : null;

    return new Booking({
      id: model.id,
      amenityId: model.amenityId,
      apartmentId: model.apartmentId,
      residentId: model.residentId,
      bookingDate: model.bookingDate,
      startTime: model.startTime,
      endTime: model.endTime,
      memberCount: model.memberCount ?? 1,
      purpose: model.purpose,
      status: model.status,
      rejectionReason: model.rejectionReason,
      cancellationReason: model.cancellationReason,
      approvedBySecurityId: model.approvedBySecurityId,
      paidAt: model.paidAt,
      paymentRef: model.paymentRef,
      receiptUrl: model.receiptUrl,
      resident,
      apartment,
      amenity,
      createdAt: model.createdAt,
    });
  }

  async create(booking: Booking): Promise<Booking> {
    const created = await BookingModel.create({
      amenityId: booking.amenityId,
      apartmentId: booking.apartmentId,
      residentId: booking.residentId,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      memberCount: booking.memberCount,
      purpose: booking.purpose,
      status: booking.status,
      receiptUrl: booking.receiptUrl,
    });
    const fetched = await BookingModel.findByPk(created.id, {
      include: bookingIncludes,
    });
    return this.toEntity(fetched ?? created);
  }

  async findById(id: number): Promise<Booking | null> {
    const model = await BookingModel.findByPk(id, {
      include: bookingIncludes,
    });
    return model ? this.toEntity(model) : null;
  }

  async update(booking: Booking): Promise<Booking> {
    await BookingModel.update(
      {
        amenityId: booking.amenityId,
        apartmentId: booking.apartmentId,
        residentId: booking.residentId,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        memberCount: booking.memberCount,
        purpose: booking.purpose,
        status: booking.status,
        rejectionReason: booking.rejectionReason,
        cancellationReason: booking.cancellationReason,
        approvedBySecurityId: booking.approvedBySecurityId,
        paidAt: booking.paidAt,
        paymentRef: booking.paymentRef,
        receiptUrl: booking.receiptUrl,
      },
      { where: { id: booking.id } }
    );
    const updated = await BookingModel.findByPk(booking.id, {
      include: bookingIncludes,
    });
    return this.toEntity(updated!);
  }

  async findOverlapping(
    amenityId: number,
    date: string,
    statuses: BookingStatus[]
  ): Promise<Booking[]> {
    const rows = await BookingModel.findAll({
      where: {
        amenityId,
        bookingDate: date,
        status: { [Op.in]: statuses },
      },
      include: bookingIncludes,
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findByApartment(apartmentId: number): Promise<Booking[]> {
    const rows = await BookingModel.findAll({
      where: { apartmentId },
      include: bookingIncludes,
      order: [["bookingDate", "DESC"], ["startTime", "ASC"]],
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findByResident(residentId: number): Promise<Booking[]> {
    const rows = await BookingModel.findAll({
      where: { residentId },
      include: bookingIncludes,
      order: [["bookingDate", "DESC"], ["startTime", "ASC"]],
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findAll(filters?: {
    amenityId?: number;
    status?: BookingStatus;
    fromDate?: string;
    toDate?: string;
    residentId?: number;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PaginatedResult<Booking>> {
    const where: Record<string, unknown> = {};
    if (filters?.amenityId) where.amenityId = filters.amenityId;
    if (filters?.status) where.status = filters.status;
    if (filters?.residentId) where.residentId = filters.residentId;
    if (filters?.fromDate || filters?.toDate) {
      const dateWhere: Record<string | symbol, unknown> = {};
      if (filters.fromDate) dateWhere[Op.gte] = filters.fromDate;
      if (filters.toDate) dateWhere[Op.lte] = filters.toDate;
      where.bookingDate = dateWhere;
    }

    const pageNumber = filters?.pageNumber ?? 1;
    const pageSize = filters?.pageSize ?? 10;

    const { count, rows } = await BookingModel.findAndCountAll({
      where,
      include: bookingIncludes,
      limit: pageSize,
      offset: (pageNumber - 1) * pageSize,
      order: [["bookingDate", "DESC"], ["startTime", "ASC"]],
    });

    const items = rows.map((row) => this.toEntity(row));

    return buildPaginatedResult(items, count, pageNumber, pageSize);
  }

  async findUpcomingConfirmed(withinMinutes: number): Promise<Booking[]> {
    const now = new Date();
    const horizon = new Date(now.getTime() + withinMinutes * 60_000);
    const rows = await BookingModel.findAll({
      where: {
        status: "Confirmed",
        bookingDate: {
          [Op.between]: [
            now.toISOString().slice(0, 10),
            horizon.toISOString().slice(0, 10),
          ],
        },
      },
      include: bookingIncludes,
      order: [["bookingDate", "ASC"], ["startTime", "ASC"]],
    });
    return rows.map((row) => this.toEntity(row));
  }

  async countByStatus(status: BookingStatus): Promise<number> {
    return BookingModel.count({ where: { status } });
  }
}
