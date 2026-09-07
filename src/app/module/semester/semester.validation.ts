import { z } from "zod";

const semesterTermEnum = z.enum(["SPRING", "SUMMER", "FALL"]);
const semesterStatusEnum = z.enum(["DRAFT", "REGISTRATION_OPEN", "ONGOING", "COMPLETED"]);

const isValidDateString = (val: string) => !Number.isNaN(Date.parse(val));

const dateSchema = (fieldName: string) =>
  z.string().refine(isValidDateString, {
    message: `${fieldName} must be a valid date string (e.g. YYYY-MM-DD or ISO 8601)`,
  });

const optionalDateSchema = (fieldName: string) =>
  z
    .string()
    .refine(isValidDateString, {
      message: `${fieldName} must be a valid date string (e.g. YYYY-MM-DD or ISO 8601)`,
    })
    .optional();

const createSemesterValidationSchema = z.object({
  body: z.object({
    year: z.number().int().positive("Year must be a positive number"),
    term: semesterTermEnum,
    status: semesterStatusEnum.optional(),
    registrationStart: dateSchema("registrationStart"),
    registrationEnd: dateSchema("registrationEnd"),
    classStart: dateSchema("classStart"),
    classEnd: dateSchema("classEnd"),
    resultDate: optionalDateSchema("resultDate"),
  }),
});

const updateSemesterValidationSchema = z.object({
  body: z
    .object({
      year: z.number().int().positive().optional(),
      term: semesterTermEnum.optional(),
      status: semesterStatusEnum.optional(),
      registrationStart: optionalDateSchema("registrationStart"),
      registrationEnd: optionalDateSchema("registrationEnd"),
      classStart: optionalDateSchema("classStart"),
      classEnd: optionalDateSchema("classEnd"),
      resultDate: optionalDateSchema("resultDate"),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
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
