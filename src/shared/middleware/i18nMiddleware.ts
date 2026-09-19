import { Request, Response, NextFunction } from "express";

export const i18nMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const queryLng = typeof req.query.lng === "string" ? req.query.lng.toLowerCase() : "";
  const header = req.headers["accept-language"] as string;
  const headerLng = header?.split(",")[0]?.split("-")[0]?.toLowerCase();

  const resolved = ["en", "gu", "hi"].includes(queryLng)
    ? queryLng
    : ["en", "gu", "hi"].includes(headerLng)
    ? headerLng
    : "en";

  req.language = resolved;
  next();
};