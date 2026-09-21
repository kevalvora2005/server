import type { Request, Response, NextFunction } from "express";
import { v2 as cloudinary } from "cloudinary";
import { ApiResponse } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/types/AuthenticatedRequest";
import { UserRole } from "../../../auth/domain/entities/User";
import { RequestingUser } from "../../../../shared/types/RequestingUser";
import { IResidentRepository } from "../../../residents/domain/repositories/IResidentRepository";

import { CreateBookingUseCase } from "../../application/use-cases/CreateBookingUseCase";
import { ListMyBookingsUseCase } from "../../application/use-cases/ListMyBookingsUseCase";
import { ListBookingsUseCase, ListBookingsFilters } from "../../application/use-cases/ListBookingsUseCase";
import { GetBookingUseCase } from "../../application/use-cases/GetBookingUseCase";
import { CancelBookingUseCase } from "../../application/use-cases/CancelBookingUseCase";
import { ApproveBookingUseCase } from "../../application/use-cases/ApproveBookingUseCase";
import { RejectBookingUseCase } from "../../application/use-cases/RejectBookingUseCase";
import { SettleBookingUseCase } from "../../application/use-cases/SettleBookingUseCase";
import { GetBookingStatsUseCase } from "../../application/use-cases/GetBookingStatsUseCase";
import { GetBookingDetailUseCase } from "../../application/use-cases/GetBookingDetailUseCase";
import { BulkRecordBookingVotesUseCase } from "../../application/use-cases/BulkRecordBookingVotesUseCase";
import { FinalizeBookingUseCase } from "../../application/use-cases/FinalizeBookingUseCase";
import { GenerateBookingReceiptUseCase } from "../../application/use-cases/GenerateBookingReceiptUseCase";

export class BookingController {
  constructor(
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly listMyBookingsUseCase: ListMyBookingsUseCase,
    private readonly listBookingsUseCase: ListBookingsUseCase,
    private readonly getBookingUseCase: GetBookingUseCase,
    private readonly cancelBookingUseCase: CancelBookingUseCase,
    private readonly approveBookingUseCase: ApproveBookingUseCase,
    private readonly rejectBookingUseCase: RejectBookingUseCase,
    private readonly settleBookingUseCase: SettleBookingUseCase,
    private readonly getBookingStatsUseCase: GetBookingStatsUseCase,
    private readonly getBookingDetailUseCase: GetBookingDetailUseCase,
    private readonly bulkRecordBookingVotesUseCase: BulkRecordBookingVotesUseCase,
    private readonly finalizeBookingUseCase: FinalizeBookingUseCase,
    private readonly generateBookingReceiptUseCase: GenerateBookingReceiptUseCase,
    private readonly residentRepository: IResidentRepository
  ) {}

  private async buildRequestingUser(authReq: AuthenticatedRequest): Promise<RequestingUser> {
    const requestingUser: RequestingUser = {
      userId: authReq.user.userId,
      role: authReq.user.role,
    };
    if (authReq.user.role === UserRole.RESIDENT) {
      const resident = await this.residentRepository.findByUserId(authReq.user.userId);
      requestingUser.residentId = resident?.id;
    }
    return requestingUser;
  }

  createBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const requestingUser = await this.buildRequestingUser(authReq);
      const booking = await this.createBookingUseCase.execute(req.body, requestingUser);
      res.status(201).json(
        ApiResponse.success(booking.toResponseObject(), "Booking request submitted successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  listMyBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const resident = await this.residentRepository.findByUserId(authReq.user.userId);
      if (!resident || !resident.id) {
        res.status(200).json(ApiResponse.success([], "No resident profile found"));
        return;
      }
      const scope = (req.query.scope as "upcoming" | "past") || "upcoming";
      const pageNumber = Number(req.query.pageNumber) || 1;
      const pageSize = Number(req.query.pageSize) || 10;
      const result = await this.listMyBookingsUseCase.execute(resident.id, scope, { pageNumber, pageSize });
      res.status(200).json(
        ApiResponse.success(
          { ...result, items: result.items.map((b) => b.toResponseObject()) },
          "My bookings fetched successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  };

  listBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters: ListBookingsFilters = {
        amenityId: req.query.amenityId ? Number(req.query.amenityId) : undefined,
        status: req.query.status as any,
        date: (req.query.date as string) || (req.query.fromDate as string),
        residentId: req.query.residentId ? Number(req.query.residentId) : undefined,
        pageNumber: Number(req.query.pageNumber) || 1,
        pageSize: Number(req.query.pageSize) || 10,
      };
      const result = await this.listBookingsUseCase.execute(filters);
      res.status(200).json(
        ApiResponse.success(
          { ...result, items: result.items.map((b) => b.toResponseObject()) },
          "Bookings fetched successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.getBookingStatsUseCase.execute();
      res.status(200).json(
        ApiResponse.success(stats, "Booking stats fetched successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  getBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await this.getBookingUseCase.execute(Number(req.params.id));
      res.status(200).json(
        ApiResponse.success(booking.toResponseObject(), "Booking fetched successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  cancelBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const requestingUser = await this.buildRequestingUser(authReq);
      const booking = await this.cancelBookingUseCase.execute(
        Number(req.params.id),
        { reason: req.body.reason },
        requestingUser
      );
      res.status(200).json(
        ApiResponse.success(booking.toResponseObject(), "Booking cancelled successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  approveBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const requestingUser = await this.buildRequestingUser(authReq);
      const booking = await this.approveBookingUseCase.execute(Number(req.params.id), requestingUser);
      res.status(200).json(
        ApiResponse.success(booking.toResponseObject(), "Booking approved successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  rejectBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await this.rejectBookingUseCase.execute(Number(req.params.id), {
        reason: req.body.reason,
      });
      res.status(200).json(
        ApiResponse.success(booking.toResponseObject(), "Booking rejected successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  settleBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const requestingUser = await this.buildRequestingUser(authReq);
      const booking = await this.settleBookingUseCase.execute(
        Number(req.params.id),
        { paymentRef: req.body.paymentRef },
        requestingUser
      );
      res.status(200).json(
        ApiResponse.success(booking.toResponseObject(), "Booking payment recorded successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  getBookingDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const detail = await this.getBookingDetailUseCase.execute(id);
      res.status(200).json(
        ApiResponse.success(
          {
            ...detail.booking.toResponseObject(),
            amenity: detail.amenity ? detail.amenity.toResponseObject() : null,
            resident: detail.resident,
            votes: detail.votes.map((v) => v.toResponseObject()),
            committeeMembers: detail.committeeMembers,
          },
          "Booking detail fetched successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  };

  getBookingReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const authReq = req as AuthenticatedRequest;
      const requestingUser = await this.buildRequestingUser(authReq);
      const targetLang = authReq.language;
      const pdfUrl = await this.generateBookingReceiptUseCase.execute(
        id,
        requestingUser,
        targetLang
      );

      if (!pdfUrl) {
        res.status(404).json(ApiResponse.error("Booking receipt not found"));
        return;
      }

      if (req.query.format === "json") {
        res.status(200).json(ApiResponse.success({ url: pdfUrl }, "Booking receipt generated successfully"));
        return;
      }

      const cloudUrl = pdfUrl.includes("fl_attachment")
        ? pdfUrl.replace("fl_attachment/", "")
        : pdfUrl;

      let response = await fetch(cloudUrl);

      if (!response.ok) {
        const isRaw = cloudUrl.includes("/raw/");
        const uploadMarker = isRaw ? "/raw/upload/" : "/image/upload/";
        const pathPart = cloudUrl.split(uploadMarker)[1];
        if (pathPart) {
          const publicId = pathPart.replace(/^v\d+\//, "").replace(/\.[^.]+$/, "");
          const signedUrl = cloudinary.url(publicId, {
            resource_type: isRaw ? "raw" : "image",
            type: "upload",
            sign_url: true,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          });
          response = await fetch(signedUrl);
        }
      }

      if (!response.ok) {
        res.status(502).json(ApiResponse.error("Failed to fetch receipt from storage"));
        return;
      }

      const pdfBuffer = Buffer.from(await response.arrayBuffer());
      const filename = `booking-receipt-${id}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };

  bulkRecordVotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const id = Number(req.params.id);
      const { votes, adminVote } = req.body;

      const recorded = await this.bulkRecordBookingVotesUseCase.execute(
        id,
        { votes: votes ?? [], adminVote },
        authReq.user.userId
      );

      res.status(200).json(
        ApiResponse.success(
          recorded.map((v) => v.toResponseObject()),
          "Votes recorded successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  };

  finalizeBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const id = Number(req.params.id);
      const booking = await this.finalizeBookingUseCase.execute(id, authReq.user.userId);

      res.status(200).json(
        ApiResponse.success(booking.toResponseObject(), "Booking request finalized successfully")
      );
    } catch (error) {
      next(error);
    }
  };
}
