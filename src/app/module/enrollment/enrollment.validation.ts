import { z } from "zod";

const createEnrollmentValidationSchema = z.object({
  body: z.object({
    sectionId: z.string().uuid("Invalid section ID"),
  }),
});

export const EnrollmentValidation = {
  createEnrollmentValidationSchema,
};
