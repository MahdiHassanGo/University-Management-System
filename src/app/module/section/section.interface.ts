import type { SectionStatus } from "@prisma/client";

export interface ISchedulePayload {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "10:30"
  room: string;
}

export interface ICreateSectionPayload {
  courseId: string;
  semesterId: string;
  instructorId: string;
  sectionNumber: number;
  capacity: number;
  status?: SectionStatus;
  schedules: ISchedulePayload[];
}

export interface IUpdateSectionPayload {
  instructorId?: string;
  capacity?: number;
  status?: SectionStatus;
  schedules?: ISchedulePayload[];
}

export interface ISectionFilterOptions {
  courseId?: string;
  semesterId?: string;
  instructorId?: string;
  status?: SectionStatus;
  searchTerm?: string;
}
