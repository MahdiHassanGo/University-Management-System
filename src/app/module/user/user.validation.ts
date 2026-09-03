import { z } from "zod";

const updateUserStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "BLOCKED", "DELETED"], {
      required_error: "Status is required",
    }),
  }),
});

export const UserValidation = {
  updateUserStatusValidationSchema,
};
