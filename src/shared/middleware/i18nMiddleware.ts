import { Request, Response, NextFunction } from "express";

export const SUPPORTED_LANGUAGES = ["en", "hi", "gu"];

export const i18nMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers["accept-language"] as string;
  const headerLng = header?.split(",")[0]?.split("-")[0]?.toLowerCase();

  req.language = SUPPORTED_LANGUAGES.includes(headerLng) ? headerLng : "en";
  next();
};