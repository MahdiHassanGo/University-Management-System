import { OAuth2Client } from "google-auth-library";
import config from "../config/index.js";
import AppError from "../utils/AppError.js";

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

export type IGoogleUserPayload = {
  email: string;
  name: string;
  googleId: string;
  emailVerified: boolean;
};

export const verifyGoogleIdToken = async (idToken: string): Promise<IGoogleUserPayload> => {
  if (!config.GOOGLE_CLIENT_ID) throw new AppError(503, "Google sign-in is not configured.");
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: config.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      throw new AppError(401, "Invalid Google ID token payload");
    }
    if (!payload.email_verified) throw new AppError(401, "Use a verified Google email address.");

    return {
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      googleId: payload.sub,
      emailVerified: Boolean(payload.email_verified),
    };
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    const errObj = error as Error;
    throw new AppError(401, `Google authentication failed: ${errObj.message || "Invalid token"}`);
  }
};
