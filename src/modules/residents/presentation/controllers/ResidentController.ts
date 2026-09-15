import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { IEmailService } from "../../../auth/domain/services/IEmailService";

import { CreateResidentUseCase } from "../../application/use-cases/CreateResidentUseCase";
import { GetResidentUseCase } from "../../application/use-cases/GetResidentUseCase";
import { ListResidentsUseCase } from "../../application/use-cases/ListResidentsUseCase";
import { UpdateResidentUseCase } from "../../application/use-cases/UpdateResidentUseCase";
import { DeactivateResidentUseCase } from "../../application/use-cases/DeactivateResidentUseCase";
import { ListApartmentTenantsUseCase } from "../../application/use-cases/ListApartmentTenantsUseCase";
import { ImportResidentsUseCase } from "../../application/use-cases/ImportResidentsUseCase";

import { ApiResponse } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/types/AuthenticatedRequest";
import { IResidentRepository } from "../../domain/repositories/IResidentRepository";
import { Resident } from "../../domain/entities/Resident";

export class ResidentController {
  constructor(
    private readonly createResidentUseCase: CreateResidentUseCase,
    private readonly getResidentUseCase: GetResidentUseCase,
    private readonly listResidentsUseCase: ListResidentsUseCase,
    private readonly updateResidentUseCase: UpdateResidentUseCase,
    private readonly deactivateResidentUseCase: DeactivateResidentUseCase,
    private readonly listApartmentTenantsUseCase: ListApartmentTenantsUseCase,
    private readonly residentRepository: IResidentRepository,
    private readonly importResidentsUseCase: ImportResidentsUseCase,
    private readonly emailService?: IEmailService
  ) { }

  createResident = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const resident = await this.createResidentUseCase.execute(req.body);

      res.status(201).json(
        ApiResponse.success({
          message: "Resident created successfully",
          data: resident.toResponseObject(),
        })
      );
    } catch (error) {
      next(error);
    }
  };

  getResident = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const resident = await this.getResidentUseCase.execute(Number(req.params.id));

      res.status(200).json(
        ApiResponse.success({
          message: "Resident fetched successfully",
          data: {
            ...resident.toResponseObject(),
            user: resident.user ?? null,
            apartment: resident.apartment ?? null,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  getMyResident = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      if (!userId) {
        res.status(401).json(ApiResponse.error("Unauthorized"));
        return;
      }

      const resident = await this.residentRepository.findByUserId(userId);
      if (!resident) {
        res.status(404).json(ApiResponse.error("Resident record not found"));
        return;
      }

      res.status(200).json(
        ApiResponse.success({
          message: "Resident record retrieved successfully",
          data: {
            ...resident.toResponseObject(),
            user: resident.user ?? null,
            apartment: resident.apartment ?? null,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  listResidents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const pageNumber = req.query.pageNumber ? Number(req.query.pageNumber) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
      const apartmentId = req.query.apartmentId ? Number(req.query.apartmentId) : undefined;
      const isOwner = req.query.isOwner !== undefined ? req.query.isOwner === "true" : undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;

      const { list, stats } = await this.listResidentsUseCase.execute({
        pageNumber,
        pageSize,
        apartmentId,
        isOwner,
        isActive,
        search,
      });

      res.status(200).json(
        ApiResponse.success({
          message: "Residents list retrieved successfully",
          data: {
            ...list,
            items: list.items.map((resItem: Resident) => ({
              ...resItem.toResponseObject(),
              user: resItem.user ?? null,
              apartment: resItem.apartment ?? null,
            })),
            stats,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  updateResident = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const resident = await this.updateResidentUseCase.execute(
        Number(req.params.id),
        req.body
      );

      res.status(200).json(
        ApiResponse.success({
          message: "Resident updated successfully",
          data: resident.toResponseObject(),
        })
      );
    } catch (error) {
      next(error);
    }
  };

  deactivateResident = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.deactivateResidentUseCase.execute(
        Number(req.params.id)
      );

      res.status(200).json(
        ApiResponse.success({
          message: "Resident deactivated successfully",
          data: null,
        })
      );
    } catch (error) {
      next(error);
    }
  };

  listApartmentTenants = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const resident = await this.residentRepository.findByUserId(authReq.user.userId);

      if (!resident) {
        res.status(404).json(ApiResponse.error("Resident profile not found"));
        return;
      }

      const history = await this.listApartmentTenantsUseCase.execute(resident.apartmentId);

      res.status(200).json(
        ApiResponse.success(
          history.map((item) => item.toResponseObject()),
          "Apartment tenant history retrieved successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  };

  promoteOccupants = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const promoted = await this.residentRepository.promoteDueOccupants();
      res.status(200).json(
        ApiResponse.success({ promoted }, "Occupant promotion completed")
      );
    } catch (error) {
      next(error);
    }
  };

  importResidents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json(
          ApiResponse.error("Excel file is required")
        );
        return;
      }

      const result = await this.importResidentsUseCase.execute(req.file.buffer);

      res.status(201).json(
        ApiResponse.success(
          result,
          `Successfully imported ${result.successCount} residents.`
        )
      );
    } catch (error) {
      next(error);
    }
  };
}