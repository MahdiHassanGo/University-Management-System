import type { AttendanceStatus } from "@prisma/client";

export interface ICreateAttendanceSessionPayload {
  heldAt: string | Date;
  topic?: string;
}

export interface IAttendanceRecordItem {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface IBulkMarkAttendancePayload {
  records: IAttendanceRecordItem[];
}

export interface IUpdateAttendanceRecordPayload {
  status?: AttendanceStatus;
  note?: string;
}
