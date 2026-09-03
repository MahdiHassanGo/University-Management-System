import { z } from "zod";

const semesterTermEnum = z.enum(["SPRING", "SUMMER", "FALL"]);
const semesterStatusEnum = z.enum(["DRAFT", "REGISTRATION_OPEN", "ONGOING", "COMPLETED"]);

const createSemesterValidationSchema = z.object({
  body: z.object({
    year: z.number().int().positive("Year must be a positive number"),
    term: semesterTermEnum,
    status: semesterStatusEnum.optional(),
    registrationStart: z.string().datetime("registrationStart must be a valid ISO date string"),
    registrationEnd: z.string().datetime("registrationEnd must be a valid ISO date string"),
    classStart: z.string().datetime("classStart must be a valid ISO date string"),
    classEnd: z.string().datetime("classEnd must be a valid ISO date string"),
    resultDate: z.string().datetime().optional(),
  }),
});

const updateSemesterValidationSchema = z.object({
  body: z.object({
    year: z.number().int().positive().optional(),
    term: semesterTermEnum.optional(),
    status: semesterStatusEnum.optional(),
    registrationStart: z.string().datetime().optional(),
    registrationEnd: z.string().datetime().optional(),
    classStart: z.string().datetime().optional(),
    classEnd: z.string().datetime().optional(),
    resultDate: z.string().datetime().optional(),
  }),
});

const updateSemesterStatusValidationSchema = z.object({
  body: z.object({
    status: semesterStatusEnum,
  }),
});

export const SemesterValidation = {
  createSemesterValidationSchema,
  updateSemesterValidationSchema,
  updateSemesterStatusValidationSchema,
};
