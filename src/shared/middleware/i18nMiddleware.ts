import { Request, Response, NextFunction } from "express";

export const SUPPORTED_LANGUAGES = ["en", "hi", "gu"];

export const i18nMiddleware = (req: Request, res: Response, next: NextFunction) => {

  const language = req.headers["accept-language"]?.toLowerCase();

  req.language = SUPPORTED_LANGUAGES.includes(language || "") ? language : "en";

  next();
};