import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application, type Request, type Response } from "express";
import globalErrorHandler from "./app/middleware/globalErrorHandler.js";
import notFound from "./app/middleware/notFound.js";

const app: Application = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  });
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
