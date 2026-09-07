import { describe, expect, it } from "vitest";
import { SemesterValidation } from "../../src/app/module/semester/semester.validation.js";
import { UserValidation } from "../../src/app/module/user/user.validation.js";

describe("Zod Validation Schema Tests", () => {
  it("should validate valid semester creation payload", () => {
    const validPayload = {
      body: {
        year: 2026,
        term: "FALL",
        status: "DRAFT",
        registrationStart: "2026-09-01",
        registrationEnd: "2026-09-15",
        classStart: "2026-09-20",
        classEnd: "2026-12-20",
      },
    };

    const parsed = SemesterValidation.createSemesterValidationSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it("should reject invalid date strings in semester validation", () => {
    const invalidPayload = {
      body: {
        year: 2026,
        term: "FALL",
        registrationStart: "invalid-date-string",
        registrationEnd: "2026-09-15",
        classStart: "2026-09-20",
        classEnd: "2026-12-20",
      },
    };

    const parsed = SemesterValidation.createSemesterValidationSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it("should validate valid user status update payload", () => {
    const validPayload = {
      body: {
        status: "BLOCKED",
      },
    };

    const parsed = UserValidation.updateUserStatusValidationSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it("should reject invalid status in user status update payload", () => {
    const invalidPayload = {
      body: {
        status: "INVALID_STATUS",
      },
    };

    const parsed = UserValidation.updateUserStatusValidationSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });
});
