import type { Request, Response, NextFunction } from "express";
import { GetMaintenanceAmountUseCase } from "../../application/use-cases/GetMaintenanceAmountUseCase";
import { UpdateMaintenanceAmountUseCase } from "../../application/use-cases/UpdateMaintenanceAmountUseCase";
import { GenerateInvoicesUseCase } from "../../application/use-cases/GenerateInvoicesUseCase";
import { ListInvoicesUseCase } from "../../application/use-cases/ListInvoicesUseCase";
import { ListMyInvoicesUseCase } from "../../application/use-cases/ListMyInvoicesUseCase";
import { v2 as cloudinary } from "cloudinary";
import { GetInvoiceUseCase } from "../../application/use-cases/GetInvoiceUseCase";
import { MarkInvoiceSettledUseCase } from "../../application/use-cases/MarkInvoiceSettledUseCase";
import { GenerateInvoicePdfUseCase } from "../../application/use-cases/GenerateInvoicePdfUseCase";
import { GetDashboardMetricsUseCase } from "../../application/use-cases/GetDashboardMetricsUseCase";
import { ApiResponse } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/types/AuthenticatedRequest";
import { InvoiceStatus } from "../../domain/entities/Invoice";
import { UserRole } from "../../../auth/domain/entities/User";
import { RequestingUser } from "../../../../shared/types/RequestingUser";
import { IResidentRepository } from "../../../residents/domain/repositories/IResidentRepository";
import { ListApartmentInvoicesUseCase } from "../../application/use-cases/ListApartmentInvoicesUseCase";

export class MaintenanceController {
  constructor(
    private readonly getMaintenanceAmountUseCase: GetMaintenanceAmountUseCase,
    private readonly updateMaintenanceAmountUseCase: UpdateMaintenanceAmountUseCase,
    private readonly generateInvoicesUseCase: GenerateInvoicesUseCase,
    private readonly listInvoicesUseCase: ListInvoicesUseCase,
    private readonly listMyInvoicesUseCase: ListMyInvoicesUseCase,
    private readonly listApartmentInvoicesUseCase: ListApartmentInvoicesUseCase,
    private readonly getInvoiceUseCase: GetInvoiceUseCase,
    private readonly markInvoiceSettledUseCase: MarkInvoiceSettledUseCase,
    private readonly generateInvoicePdfUseCase: GenerateInvoicePdfUseCase,
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase,
    private readonly residentRepository: IResidentRepository,
  ) { }

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

  getMaintenanceAmount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const setting = await this.getMaintenanceAmountUseCase.execute();

      res.status(200).json(
        ApiResponse.success(setting.toResponseObject(), "Maintenance amount fetched successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  updateMaintenanceAmount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const setting = await this.updateMaintenanceAmountUseCase.execute({ amount: req.body.amount });

      res.status(200).json(
        ApiResponse.success(setting.toResponseObject(), "Maintenance amount updated successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  generateInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoices = await this.generateInvoicesUseCase.execute({
        month: req.body.month,
        year: req.body.year,
        dueDate: new Date(req.body.dueDate),
        extraCharges: req.body.extraCharges,
      });

      res.status(201).json(
        ApiResponse.success(
          invoices.map((inv) => inv.toResponseObject()),
          `${invoices.length} invoices generated successfully`
        )
      );
    } catch (error) {
      next(error);
    }
  };

  listInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.listInvoicesUseCase.execute({
        pageNumber: Number(req.query.pageNumber) || 1,
        pageSize: Number(req.query.pageSize) || 10,
        status: req.query.status ? (req.query.status as unknown as InvoiceStatus) : undefined,
        month: req.query.month ? Number(req.query.month) : undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
        search: req.query.search as string | undefined,
      });

      res.status(200).json(
        ApiResponse.success(
          { ...result, items: result.items.map((inv) => inv.toResponseObject()) },
          "Invoices fetched successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  };

  listMyInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const resident = await this.residentRepository.findByUserId(authReq.user.userId);

      if (!resident) {
        res.status(404).json(ApiResponse.error("Resident profile not found"));
        return;
      }

      const result = await this.listMyInvoicesUseCase.execute(resident.id!, {
        pageNumber: Number(req.query.pageNumber) || 1,
        pageSize: Number(req.query.pageSize) || 10,
        status: req.query.status ? (req.query.status as unknown as InvoiceStatus) : undefined,
        month: req.query.month ? Number(req.query.month) : undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
        search: req.query.search as string | undefined,
      });

      res.status(200).json(
        ApiResponse.success(
          { ...result, items: result.items.map((inv) => inv.toResponseObject()) },
          "Your invoices fetched successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  };

  listApartmentInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const resident = await this.residentRepository.findByUserId(authReq.user.userId);

      if (!resident) {
        res.status(404).json(ApiResponse.error("Resident profile not found"));
        return;
      }

      const result = await this.listApartmentInvoicesUseCase.execute(resident.id!, {
        pageNumber: Number(req.query.pageNumber) || 1,
        pageSize: Number(req.query.pageSize) || 10,
        status: req.query.status ? (req.query.status as unknown as InvoiceStatus) : undefined,
        month: req.query.month ? Number(req.query.month) : undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
        search: req.query.search as string | undefined,
      });

      res.status(200).json(
        ApiResponse.success(
          { ...result, items: result.items.map((inv) => inv.toResponseObject()) },
          "Apartment invoices fetched successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  };

  getInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const requestingUser = await this.buildRequestingUser(authReq);

      const invoice = await this.getInvoiceUseCase.execute(Number(req.params.id), requestingUser);

      res.status(200).json(
        ApiResponse.success(invoice.toResponseObject(), "Invoice fetched successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  markInvoiceSettled = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const requestingUser = await this.buildRequestingUser(authReq);
      const targetLang =
        (typeof req.query.lng === "string" ? req.query.lng : "") ||
        authReq.language ||
        authReq.user?.preferredLanguage;

      const invoice = await this.markInvoiceSettledUseCase.execute(
        Number(req.params.id),
        req.body.paymentRef,
        requestingUser,
        targetLang,
      );

      res.status(200).json(
        ApiResponse.success(invoice.toResponseObject(), "Invoice marked as settled")
      );
    } catch (error) {
      next(error);
    }
  };

  regenerateReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const targetLang =
        (typeof req.query.lng === "string" ? req.query.lng : "") ||
        authReq.language ||
        authReq.user?.preferredLanguage;
      const pdfUrl = await this.generateInvoicePdfUseCase.execute(Number(req.params.id), targetLang);

      res.status(200).json(
        ApiResponse.success({ pdfUrl }, "Receipt regenerated successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  downloadReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const requestingUser = await this.buildRequestingUser(authReq);

      const targetLang =
        (typeof req.query.lng === "string" ? req.query.lng : "") ||
        authReq.language ||
        authReq.user?.preferredLanguage;
      const pdfUrl = await this.generateInvoicePdfUseCase.execute(Number(req.params.id), targetLang);

      if (!pdfUrl) {
        res.status(404).json(ApiResponse.error("Receipt not found"));
        return;
      }

      const cloudUrl = pdfUrl.includes("fl_attachment")
        ? pdfUrl.replace("fl_attachment/", "")
        : pdfUrl;

      let response = await fetch(cloudUrl);

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("Direct Cloudinary fetch failed:", response.status, text.slice(0, 200));

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

          console.log("Retrying with signed URL:", signedUrl);
          response = await fetch(signedUrl);
        }
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("Signed Cloudinary fetch also failed:", response.status, text.slice(0, 200));
        res.status(502).json(ApiResponse.error("Failed to fetch receipt from storage"));
        return;
      }

      const pdfBuffer = Buffer.from(await response.arrayBuffer());
      const filename = `invoice-${req.params.id}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("downloadReceipt error:", error);
      next(error);
    }
  };

  getDashboardMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (authReq.user.role === UserRole.ADMIN) {
        const metrics = await this.getDashboardMetricsUseCase.executeForAdmin();
        res.status(200).json(ApiResponse.success(metrics, "Dashboard metrics fetched"));
        return;
      }

      const resident = await this.residentRepository.findByUserId(authReq.user.userId);
      if (!resident) {
        res.status(404).json(ApiResponse.error("Resident profile not found"));
        return;
      }

      const metrics = await this.getDashboardMetricsUseCase.executeForResident(resident.id!);
      res.status(200).json(ApiResponse.success(metrics, "Dashboard metrics fetched"));
    } catch (error) {
      next(error);
    }
  };
}