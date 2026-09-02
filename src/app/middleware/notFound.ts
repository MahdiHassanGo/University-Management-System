import type { Request, Response } from "express";

const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
    errors: [
      {
        path: req.originalUrl,
        message: `Requested route ${req.originalUrl} was not found on this server.`,
      },
    ],
  });
};

export default notFound;
