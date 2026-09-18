import { Request, Response, NextFunction } from "express";

export const i18nMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers["accept-language"] as string;
  req.language = header?.split(",")[0]?.split("-")[0] || "en";
  next();
};