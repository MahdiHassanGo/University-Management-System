import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import config from "../config/index.js";
import prisma from "../lib/prisma.js";
import AppError from "../utils/AppError.js";
import { verifyToken } from "../utils/jwt.js";

const checkAuth = (...requiredRoles: Role[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      let token = req.headers.authorization;

      if (!token && req.cookies?.accessToken) {
        token = req.cookies.accessToken;
      }

      if (!token) {
        throw new AppError(401, "You are not authorized! Token is missing.");
      }

      if (token.startsWith("Bearer ")) {
        token = token.split(" ")[1];
      }

      let verifiedUser: JwtPayload;
      try {
        verifiedUser = verifyToken(token, config.JWT_ACCESS_SECRET);
      } catch (_error) {
        throw new AppError(401, "Invalid or expired access token!");
      }

      const userId = verifiedUser.userId as string;
      const role = verifiedUser.role as Role;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError(404, "User not found!");
      }

      if (user.status === "BLOCKED") {
        throw new AppError(403, "Your account is blocked!");
      }

      if (user.status === "DELETED") {
        throw new AppError(403, "Your account has been deleted!");
      }

      if (requiredRoles.length && !requiredRoles.includes(role)) {
        throw new AppError(403, "Forbidden! You do not have permission to access this resource.");
      }

      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default checkAuth;
