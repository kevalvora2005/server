import { IResidentRepository } from "../../domain/repositories/IResidentRepository";
import { IUserRepository } from "../../../auth/domain/repositories/IUserRepository";
import { IEmailService } from "../../../auth/domain/services/IEmailService";
import { UserRole } from "../../../auth/domain/entities/User";
import { UserModel } from "../../../auth/infrastructure/models/UserModel";
import { ResidentModel } from "../../infrastructure/models/ResidentModel";
import { ApartmentModel } from "../../../apartments/infrastructure/models/ApartmentModel";
import * as XLSX from "xlsx";
import { sequelize } from "../../../../shared/config/db";
import { buildWelcomeEmailTemplate } from "../templates/welcomeEmailTemplate";
import { importResidentRowSchema } from "../../presentation/validators/residentValidators";
import { generateRandomPassword } from "../../../../shared/utils/generateRandomPassword";
import { CognitoAuthService } from "../../../auth/infrastructure/services/CognitoAuthService";

export interface FailedImportItem {
  row: number;
  identifier: string;
  reason: string;
}

export interface CreatedResidentEmailItem {
  userId: number;
  email: string;
  name: string;
  unit: string;
  temporaryPassword?: string;
  preferredLanguage?: string;
  status: "pending" | "sending" | "sent" | "failed";
  error?: string;
}

export interface ImportResidentsResult {
  successCount: number;
  failedCount: number;
  failedItems: FailedImportItem[];
  createdResidents?: CreatedResidentEmailItem[];
}

export class ImportResidentsUseCase {
  constructor(
    private readonly residentRepository: IResidentRepository,
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
    private readonly cognitoAuthService: CognitoAuthService
  ) { }

  async execute(fileBuffer: Buffer): Promise<ImportResidentsResult> {
    let workbook;
    try {
      workbook = XLSX.read(fileBuffer, { type: "buffer" });
    } catch {
      throw new Error("Invalid Excel file format. Please upload a valid .xlsx or .xls file.");
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("Excel file is empty and contains no worksheets.");
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

    if (rows.length === 0) {
      throw new Error("No data rows found in the uploaded Excel sheet.");
    }

    const failedItems: FailedImportItem[] = [];

    const getCellValue = (row: Record<string, unknown>, candidateKeys: string[]): unknown => {
      const keys = Object.keys(row);
      for (const candidate of candidateKeys) {
        const cleanCandidate = candidate.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
        const matchKey = keys.find(
          (k) => k.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, "") === cleanCandidate
        );
        if (matchKey && row[matchKey] !== undefined && row[matchKey] !== null) {
          const valStr = String(row[matchKey]).trim();
          if (valStr !== "") return row[matchKey];
        }
      }
      return undefined;
    };

    const validRows: {
      rowNum: number;
      name: string;
      email: string;
      password: string;
      phone: string;
      block: string;
      floorNumber: number;
      unitNumber: string;
      isCommitteeMember: boolean;
      preferredLanguage: string;
    }[] = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 2;

      const rawName = getCellValue(row, ["Name", "name", "Full Name", "नाम", "पूरा नाम", "નામ", "પૂરું નામ"]);
      const rawEmail = getCellValue(row, ["Email", "email", "Email Address", "ईमेल", "ઇમેઇલ"]);
      const rawPhone = getCellValue(row, ["Phone", "phone", "Mobile", "Contact", "फ़ोन", "फोन", "मोबाइल", "મોબાઇલ", "સંપર્ક"]);
      const rawBlock = getCellValue(row, ["Block", "block", "Block Name", "ब्लॉक", "બ્લોક"]);
      const rawFloor = getCellValue(row, ["Floor Number", "Floor", "floorNumber", "floor", "मंजिल", "માળ"]);
      const rawUnit = getCellValue(row, ["Unit Number", "Unit", "unitNumber", "Flat Number", "unit", "इकाई", "फ्लैट", "એકમ", "ફ્લેટ"]);
      const rawCommittee = getCellValue(row, ["Is Committee Member", "Committee Member", "isCommitteeMember", "Committee", "समिति सदस्य", "સમિતિ સભ્ય"]);
      const rawLang = getCellValue(row, ["Language", "language", "Preferred Language", "भाषा", "ભાષા"]);

      if (rawName === undefined && rawEmail === undefined && rawPhone === undefined && rawBlock === undefined && rawFloor === undefined && rawUnit === undefined) {
        continue;
      }

      let rawUnitStr = rawUnit !== undefined && rawUnit !== null ? String(rawUnit).trim() : undefined;
      if (rawUnitStr?.endsWith(".0")) rawUnitStr = rawUnitStr.slice(0, -2);
      if (rawUnitStr && /^\d+$/.test(rawUnitStr)) {
        const uInt = parseInt(rawUnitStr, 10);
        if (uInt > 0) rawUnitStr = String(uInt).padStart(2, "0");
      }

      let isCommitteeMember = false;
      if (rawCommittee !== undefined && rawCommittee !== null) {
        const str = String(rawCommittee).trim().toLowerCase();
        if (["yes", "y", "true", "1", "हाँ", "હા"].includes(str)) {
          isCommitteeMember = true;
        }
      }

      let preferredLanguage = "en";
      if (rawLang) {
        const l = String(rawLang).trim().toLowerCase();
        if (l.startsWith("hi") || l === "हिन्दी") preferredLanguage = "hi";
        else if (l.startsWith("gu") || l === "ગુજરાતી") preferredLanguage = "gu";
      }

      let rawPhoneStr = rawPhone !== undefined && rawPhone !== null ? String(rawPhone).trim() : undefined;
      if (rawPhoneStr?.endsWith(".0")) rawPhoneStr = rawPhoneStr.slice(0, -2);
      const cleanPhone = rawPhoneStr ? rawPhoneStr.replace(/[^0-9+]/g, "") : undefined;

      const candidate = {
        name: rawName !== undefined && rawName !== null ? String(rawName).trim() : undefined,
        email: rawEmail !== undefined && rawEmail !== null ? String(rawEmail).trim().toLowerCase() : undefined,
        phone: cleanPhone,
        block: rawBlock !== undefined && rawBlock !== null ? String(rawBlock).trim().toUpperCase() : undefined,
        floorNumber: rawFloor !== undefined && rawFloor !== null && String(rawFloor).trim() !== "" ? Number(String(rawFloor).trim()) : undefined,
        unitNumber: rawUnitStr,
        isCommitteeMember,
      };

      const { error, value } = importResidentRowSchema.validate(candidate, { abortEarly: false });

      if (error) {
        failedItems.push({
          row: rowNum,
          identifier: candidate.email || candidate.name || `Row #${rowNum}`,
          reason: error.details.map((d) => d.message).join("; "),
        });
      } else {
        const generatedPassword = generateRandomPassword(11);
        validRows.push({
          rowNum,
          name: value.name,
          email: value.email,
          password: generatedPassword,
          phone: value.phone,
          block: value.block,
          floorNumber: value.floorNumber,
          unitNumber: value.unitNumber,
          isCommitteeMember: value.isCommitteeMember ?? isCommitteeMember,
          preferredLanguage,
        });
      }
    }

    if (validRows.length === 0) {
      return {
        successCount: 0,
        failedCount: failedItems.length,
        failedItems,
      };
    }

    const seenEmails = new Map<string, number>();
    const uniqueRows: typeof validRows = [];
    for (const item of validRows) {
      if (seenEmails.has(item.email)) {
        const firstRow = seenEmails.get(item.email)!;
        failedItems.push({
          row: item.rowNum,
          identifier: item.email,
          reason: `Duplicate email '${item.email}' in Excel sheet (first seen at Row #${firstRow})`,
        });
      } else {
        seenEmails.set(item.email, item.rowNum);
        uniqueRows.push(item);
      }
    }

    if (uniqueRows.length === 0) {
      return {
        successCount: 0,
        failedCount: failedItems.length,
        failedItems,
      };
    }

    const emailsToQuery = uniqueRows.map((r) => r.email);

    const existingUserModels = await UserModel.findAll({
      where: { email: emailsToQuery },
    });

    const userMapByEmail = new Map<string, UserModel>();
    for (const u of existingUserModels) {
      userMapByEmail.set(u.email.toLowerCase(), u);
    }

    const allApartments = await ApartmentModel.findAll();

    const apartmentMap = new Map<string, ApartmentModel>();
    for (const apt of allApartments) {
      const key = `${apt.block.toUpperCase()}-${apt.floorNumber}-${apt.unitNumber.padStart(2, "0")}`;
      apartmentMap.set(key, apt);
    }

    const activeResidents = await ResidentModel.findAll({
      where: { isActive: true },
    });

    const occupiedApartmentIds = new Set<number>();
    for (const res of activeResidents) {
      occupiedApartmentIds.add(res.apartmentId);
    }

    const createdResidents: CreatedResidentEmailItem[] = [];
    let successCount = 0;

    for (const item of uniqueRows) {
      const aptKey = `${item.block}-${item.floorNumber}-${item.unitNumber}`;
      const apartment = apartmentMap.get(aptKey);

      if (!apartment) {
        failedItems.push({
          row: item.rowNum,
          identifier: item.email,
          reason: `Apartment unit '${item.block}-${item.floorNumber}${item.unitNumber}' does not exist in society`,
        });
        continue;
      }

      if (occupiedApartmentIds.has(apartment.id)) {
        failedItems.push({
          row: item.rowNum,
          identifier: item.email,
          reason: `Apartment unit '${item.block}-${item.floorNumber}${item.unitNumber}' is already occupied by an active resident`,
        });
        continue;
      }

      const existingUser = userMapByEmail.get(item.email);
      if (existingUser && existingUser.isActive) {
        failedItems.push({
          row: item.rowNum,
          identifier: item.email,
          reason: `An active user with email '${item.email}' already exists in society`,
        });
        continue;
      }

      let cognitoSub: string | undefined = existingUser?.cognitoSub || undefined;
      if (!cognitoSub) {
        try {
          cognitoSub = await this.cognitoAuthService.adminCreateUser(
            item.email,
            item.name,
            item.phone,
            UserRole.RESIDENT,
            item.password
          );
        } catch (error: any) {
          failedItems.push({
            row: item.rowNum,
            identifier: item.email,
            reason: error.message || "Failed to create resident in identity provider",
          });
          continue;
        }
      }

      const transaction = await sequelize.transaction();

      try {
        let createdUser: UserModel;

        if (existingUser && !existingUser.isActive) {
          existingUser.name = item.name;
          existingUser.phone = item.phone;
          existingUser.isActive = true;
          existingUser.mustResetPassword = true;
          if (cognitoSub) existingUser.cognitoSub = cognitoSub;
          await existingUser.save({ transaction });
          createdUser = existingUser;
        } else {
          createdUser = await UserModel.create(
            {
              cognitoSub: cognitoSub || null,
              name: item.name,
              email: item.email,
              phone: item.phone,
              role: UserRole.RESIDENT,
              isActive: true,
              mustResetPassword: true,
              preferredLanguage: item.preferredLanguage,
              locale: item.preferredLanguage === "hi" ? "hi-IN" : item.preferredLanguage === "gu" ? "gu-IN" : "en-IN",
            },
            { transaction }
          );
        }

        await ResidentModel.create(
          {
            userId: createdUser.id!,
            apartmentId: apartment.id,
            isOwner: true,
            isCommitteeMember: item.isCommitteeMember,
            isOccupant: true,
            moveInDate: new Date(),
            isActive: true,
          },
          { transaction }
        );

        await transaction.commit();

        occupiedApartmentIds.add(apartment.id);
        successCount++;

        const unitLabel = `${apartment.block}-${apartment.floorNumber}${apartment.unitNumber}`;

        createdResidents.push({
          userId: createdUser.id!,
          email: item.email,
          name: item.name,
          unit: unitLabel,
          temporaryPassword: item.password,
          preferredLanguage: item.preferredLanguage,
          status: "pending",
        });
      } catch (err: unknown) {
        await transaction.rollback();
        const msg = err instanceof Error ? err.message : "Database error during creation";
        failedItems.push({
          row: item.rowNum,
          identifier: item.email,
          reason: `Failed to create resident: ${msg}`,
        });
      }
    }

    if (this.emailService && createdResidents.length > 0) {
      for (const item of createdResidents) {
        (async () => {
          try {
            const { subject, html } = await buildWelcomeEmailTemplate({
              name: item.name,
              email: item.email,
              unitName: item.unit,
              temporaryPassword: item.temporaryPassword || "",
              preferredLanguage: item.preferredLanguage,
            });

            await this.emailService!.sendEmail({
              to: item.email,
              subject,
              html,
            });
          } catch (err) {
            console.error(`[ImportResidentsUseCase] Failed to send welcome email to ${item.email}:`, err);
          }
        })();
      }
    }

    return {
      successCount,
      failedCount: failedItems.length,
      failedItems,
    };
  }
}
