import { ApartmentType } from "../../domain/entities/Apartment";
import { ApartmentModel } from "../../infrastructure/models/ApartmentModel";
import * as XLSX from "xlsx";
import { createApartmentSchema } from "../../presentation/validators/apartmentValidators";

export interface FailedImportItem {
  row: number;
  identifier: string;
  reason: string;
}

export interface ImportApartmentsResult {
  successCount: number;
  failedCount: number;
  failedItems: FailedImportItem[];
}

export class ImportApartmentsUseCase {
  async execute(fileBuffer: Buffer): Promise<ImportApartmentsResult> {
    // 0. Bulk import is allowed ONLY during initial setup when NO apartments exist in DB
    const existingCount = await ApartmentModel.count();
    if (existingCount > 0) {
      throw new Error("Bulk import is only allowed when no apartments exist in the database.");
    }

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

    // Helper to extract cell values case-insensitively with header variations across languages
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

    // Pre-fetch all existing apartment block-floor-unit keys in database
    const existingApartments = await ApartmentModel.findAll({
      attributes: ["block", "floorNumber", "unitNumber"],
    });

    const existingDbKeys = new Set<string>();
    for (const apt of existingApartments) {
      existingDbKeys.add(`${apt.block.toUpperCase()}-${apt.floorNumber}-${apt.unitNumber.padStart(2, "0")}`);
    }

    const seenFileKeys = new Map<string, number>(); // key -> rowNum
    const validRowsToInsert: {
      rowNum: number;
      block: string;
      floorNumber: number;
      unitNumber: string;
      areaSqft: number;
      type: ApartmentType;
      key: string;
    }[] = [];

    const validTypes = Object.values(ApartmentType);

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 2; // Data starts at Row 2

      const rawBlock = getCellValue(row, ["Block", "block", "Block Name", "ब्लॉक", "બ્લોક"]);
      const rawFloor = getCellValue(row, ["Floor Number", "Floor", "floorNumber", "floor", "मंजिल", "માળ"]);
      const rawUnit = getCellValue(row, ["Unit Number", "Unit", "unitNumber", "Flat Number", "unit", "इकाई", "फ्लैट", "એકમ", "ફ્લેટ"]);
      const rawArea = getCellValue(row, ["Area (Sqft)", "Area", "areaSqft", "area_sqft", "sqft", "क्षेत्रफल", "વિસ્તાર"]);
      const rawType = getCellValue(row, ["Type (BHK)", "Type BHK", "Type", "Apartment Type", "type", "BHK", "प्रकार", "પ્રકાર"]);

      // Skip completely blank or unpopulated pre-formatted rows
      const hasBlock = rawBlock !== undefined && rawBlock !== null && String(rawBlock).trim() !== "";
      const hasFloor = rawFloor !== undefined && rawFloor !== null && String(rawFloor).trim() !== "" && Number(rawFloor) !== 0;
      const hasUnit = rawUnit !== undefined && rawUnit !== null && String(rawUnit).trim() !== "" && Number(rawUnit) !== 0;
      const hasArea = rawArea !== undefined && rawArea !== null && String(rawArea).trim() !== "" && Number(rawArea) !== 0;
      const hasType = rawType !== undefined && rawType !== null && String(rawType).trim() !== "";

      if (!hasBlock && !hasFloor && !hasUnit && !hasArea && !hasType) {
        continue;
      }

      // Format unit string
      let rawUnitStr = rawUnit !== undefined && rawUnit !== null ? String(rawUnit).trim() : undefined;
      if (rawUnitStr?.endsWith(".0")) rawUnitStr = rawUnitStr.slice(0, -2);
      if (rawUnitStr && /^\d+$/.test(rawUnitStr)) {
        const uInt = parseInt(rawUnitStr, 10);
        if (uInt > 0) rawUnitStr = String(uInt).padStart(2, "0");
      }

      // Normalize apartment type
      let type: ApartmentType | undefined = undefined;
      if (rawType !== undefined && rawType !== null) {
        const cleanType = String(rawType).trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
        if (cleanType.includes("1bhk") || cleanType.includes("1बीएचके") || cleanType.includes("1બીએચકે") || cleanType === "1") type = ApartmentType.ONE_BHK;
        else if (cleanType.includes("2bhk") || cleanType.includes("2बीएचके") || cleanType.includes("2બીએચકે") || cleanType === "2") type = ApartmentType.TWO_BHK;
        else if (cleanType.includes("3bhk") || cleanType.includes("3बीएचके") || cleanType.includes("3બીએચકે") || cleanType === "3") type = ApartmentType.THREE_BHK;
        else if (cleanType.includes("4bhk") || cleanType.includes("4बीएचકે") || cleanType.includes("4બીએચકે") || cleanType === "4") type = ApartmentType.FOUR_BHK;
        else {
          const directMatch = validTypes.find((t) => t.toLowerCase() === cleanType);
          if (directMatch) type = directMatch;
        }
      }

      const candidate = {
        block: rawBlock !== undefined && rawBlock !== null ? String(rawBlock).trim().toUpperCase() : undefined,
        floorNumber: rawFloor !== undefined && rawFloor !== null && String(rawFloor).trim() !== "" ? Number(String(rawFloor).trim()) : undefined,
        unitNumber: rawUnitStr,
        areaSqft: rawArea !== undefined && rawArea !== null && String(rawArea).trim() !== "" ? Number(String(rawArea).trim()) : undefined,
        type,
      };

      // ─── Validate with Joi schema ───
      const { error, value } = createApartmentSchema.validate(candidate, { abortEarly: false });

      if (error) {
        failedItems.push({
          row: rowNum,
          identifier: candidate.block && candidate.unitNumber ? `${candidate.block}-${candidate.unitNumber}` : `Row ${rowNum}`,
          reason: error.details.map((d) => d.message).join("; "),
        });
        continue;
      }

      const block = value.block;
      const floorNumber = value.floorNumber;
      const unitNumber = value.unitNumber;
      const areaSqft = value.areaSqft;
      const validatedType = value.type as ApartmentType;

      // Build Unique Key
      const key = `${block}-${floorNumber}-${unitNumber}`;

      // Check DB duplication
      if (existingDbKeys.has(key)) {
        failedItems.push({
          row: rowNum,
          identifier: `${block}-${floorNumber}${unitNumber}`,
          reason: `Apartment ${block}-${floorNumber}${unitNumber} already exists in database`,
        });
        continue;
      }

      // Check File duplication
      if (seenFileKeys.has(key)) {
        const prevRow = seenFileKeys.get(key);
        failedItems.push({
          row: rowNum,
          identifier: `${block}-${floorNumber}${unitNumber}`,
          reason: `Duplicate row in Excel file (same unit as Row ${prevRow})`,
        });
        continue;
      }

      seenFileKeys.set(key, rowNum);
      validRowsToInsert.push({
        rowNum,
        block,
        floorNumber,
        unitNumber,
        areaSqft,
        type: validatedType,
        key,
      });
    }

    if (validRowsToInsert.length === 0) {
      return {
        successCount: 0,
        failedCount: failedItems.length,
        failedItems,
      };
    }

    // Bulk insertion
    await ApartmentModel.bulkCreate(
      validRowsToInsert.map((item) => ({
        block: item.block,
        floorNumber: item.floorNumber,
        unitNumber: item.unitNumber,
        areaSqft: item.areaSqft,
        type: item.type,
      }))
    );

    return {
      successCount: validRowsToInsert.length,
      failedCount: failedItems.length,
      failedItems,
    };
  }
}
