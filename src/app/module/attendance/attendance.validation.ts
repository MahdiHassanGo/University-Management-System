import { z } from "zod";

const attendanceStatusEnum = z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]);

const isValidDateString = (val: string) => !Number.isNaN(Date.parse(val));

const dateSchema = (fieldName: string) =>
  z.string().refine(isValidDateString, {
    message: `${fieldName} must be a valid date string (e.g. YYYY-MM-DD or ISO 8601)`,
  });

const createAttendanceSessionValidationSchema = z.object({
  body: z.object({
    heldAt: dateSchema("heldAt"),
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
