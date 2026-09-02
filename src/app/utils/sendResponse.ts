import type { Response } from "express";

export type IResponseData<T> = {
  statusCode: number;
  success: boolean;
  message?: string | null;
  data?: T | null;
};

const sendResponse = <T>(res: Response, data: IResponseData<T>): void => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message || null,
    data: data.data !== undefined ? data.data : null,
  });
};

export default sendResponse;
