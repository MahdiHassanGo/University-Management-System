import { z } from "zod";

const attendanceStatusEnum = z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]);

const createAttendanceSessionValidationSchema = z.object({
  body: z.object({
    heldAt: z.string().datetime("heldAt must be a valid ISO date string"),
    topic: z.string().optional(),
  }),
});

const bulkMarkAttendanceValidationSchema = z.object({
  body: z.object({
    records: z
      .array(
        z.object({
          studentId: z.string().uuid("Invalid student ID"),
          status: attendanceStatusEnum,
          note: z.string().optional(),
        }),
      )
      .min(1, "At least one attendance record is required"),
  }),
});

const updateAttendanceRecordValidationSchema = z.object({
  body: z.object({
    status: attendanceStatusEnum.optional(),
    note: z.string().optional(),
  }),
});

export const AttendanceValidation = {
  createAttendanceSessionValidationSchema,
  bulkMarkAttendanceValidationSchema,
  updateAttendanceRecordValidationSchema,
};
