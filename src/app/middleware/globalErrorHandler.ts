import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import config from "../config/index.js";
import type { IGenericErrorMessage } from "../interfaces/index.js";
import AppError from "../utils/AppError.js";

type PrismaErrorLike = {
  name?: string;
  code?: string;
  meta?: {
    target?: string | string[];
    field_name?: string;
    cause?: string;
  };
  message?: string;
};

const globalErrorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = "Something went wrong!";
  let errorSources: IGenericErrorMessage[] = [];

  const prismaErr = err as PrismaErrorLike;

  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errorSources = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [
      {
        path: "",
        message: err.message,
      },
    ];
  } else if (prismaErr?.name === "PrismaClientKnownRequestError") {
    if (prismaErr.code === "P2002") {
      statusCode = 409;
      const target = prismaErr.meta?.target
        ? Array.isArray(prismaErr.meta.target)
          ? prismaErr.meta.target.join(", ")
          : String(prismaErr.meta.target)
        : "field";
      message = `Duplicate value for unique constraint: ${target}`;
      errorSources = [
        {
          path: target,
          message,
        },
      ];
    } else if (prismaErr.code === "P2003") {
      statusCode = 400;
      message = "Invalid reference or foreign key constraint failed";
      errorSources = [
        {
          path: prismaErr.meta?.field_name ? String(prismaErr.meta.field_name) : "",
          message,
        },
      ];
    } else if (prismaErr.code === "P2025") {
      statusCode = 404;
      message = (prismaErr.meta?.cause as string) || "Record to update/delete does not exist";
      errorSources = [
        {
          path: "",
          message,
        },
      ];
    } else if (prismaErr.code === "P2034") {
      statusCode = 409;
      message = "Transaction failed due to concurrent write conflict. Please retry.";
      errorSources = [
        {
          path: "",
          message,
        },
      ];
    } else {
      statusCode = 400;
      message = prismaErr.message || "Database error occurred";
      errorSources = [
        {
          path: "",
          message,
        },
      ];
    }
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [
      {
        path: "",
        message: err.message,
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errorSources,
    ...(config.NODE_ENV === "development" && { stack: (err as Error)?.stack }),
  });
};

export default globalErrorHandler;
