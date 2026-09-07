import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import config from "./app/config/index.js";
import globalErrorHandler from "./app/middleware/globalErrorHandler.js";
import notFound from "./app/middleware/notFound.js";

import router from "./app/routes/index.js";

const app: Application = express();

app.use(helmet());

const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: config.RATE_LIMIT_MAX || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

app.use(limiter);

app.use(
  cors({
    origin: config.CORS_ORIGIN === "*" ? true : config.CORS_ORIGIN?.split(",") || true,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", router);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "University Management System API is healthy",
    data: {
      status: "OK",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "University Management System API is running",
    data: {
      status: "OK",
      service: "University Management System API",
      version: "1.0.0",
    },
  });
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
