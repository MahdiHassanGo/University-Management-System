import { z } from "zod";

const timeFormatRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const scheduleSchema = z.object({
  dayOfWeek: z
    .number()
    .int()
    .min(0)
    .max(6, "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)"),
  startTime: z.string().regex(timeFormatRegex, "startTime must be in HH:mm format (e.g. 09:00)"),
  endTime: z.string().regex(timeFormatRegex, "endTime must be in HH:mm format (e.g. 10:30)"),
  room: z.string().min(1, "Room is required"),
});

const sectionStatusEnum = z.enum(["DRAFT", "OPEN", "CLOSED", "COMPLETED"]);

const createSectionValidationSchema = z.object({
  body: z.object({
    courseId: z.string().uuid("Invalid course ID"),
    semesterId: z.string().uuid("Invalid semester ID"),
    instructorId: z.string().uuid("Invalid instructor ID"),
    sectionNumber: z.number().int().positive("sectionNumber must be a positive integer"),
    capacity: z.number().int().positive("capacity must be a positive integer"),
    status: sectionStatusEnum.optional(),
    schedules: z.array(scheduleSchema).min(1, "At least one schedule slot is required"),
  }),
});

const updateSectionValidationSchema = z.object({
  body: z.object({
    instructorId: z.string().uuid().optional(),
    capacity: z.number().int().positive().optional(),
    status: sectionStatusEnum.optional(),
    schedules: z.array(scheduleSchema).optional(),
  }),
});

export const SectionValidation = {
  createSectionValidationSchema,
  updateSectionValidationSchema,
};
