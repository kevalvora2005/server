import express from "express";
import cors from "cors";

import { errorHandler } from "./shared/middleware/errorHandler";
import { i18nMiddleware } from "./shared/middleware/i18nMiddleware";
import routes from "./routes";

const app = express();

/*
|--------------------------------------------------------------------------
| Global Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",

    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(i18nMiddleware);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.use('/api', routes);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorHandler);

export default app;