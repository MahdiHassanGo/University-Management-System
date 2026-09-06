import { z } from "zod";

const createCourseValidationSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Course code is required"),
    title: z.string().min(1, "Course title is required"),
    credit: z.number().int().positive("Course credit must be a positive integer"),
    courseLevel: z.number().int().positive().optional(),
    departmentId: z.string().uuid("Invalid department ID"),
    isActive: z.boolean().optional(),
  }),
});

const updateCourseValidationSchema = z.object({
  body: z
    .object({
      code: z.string().min(1).optional(),
      title: z.string().min(1).optional(),
      credit: z.number().int().positive().optional(),
      courseLevel: z.number().int().positive().optional(),
      departmentId: z.string().uuid().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),
});

const addProgramCourseValidationSchema = z.object({
  body: z.object({
    courseId: z.string().uuid("Invalid course ID"),
    recommendedSemester: z.number().int().positive("Recommended semester must be positive"),
    isOptional: z.boolean().optional(),
  }),
});

const addPrerequisiteValidationSchema = z.object({
  body: z.object({
    prerequisiteId: z.string().uuid("Invalid prerequisite course ID"),
    minGradePoint: z.number().min(0.0).max(4.0).optional(),
  }),
});

export const CourseValidation = {
  createCourseValidationSchema,
  updateCourseValidationSchema,
  addProgramCourseValidationSchema,
  addPrerequisiteValidationSchema,
};
