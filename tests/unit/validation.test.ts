import { describe, expect, it } from "vitest";
import { SemesterValidation } from "../../src/app/module/semester/semester.validation.js";

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
});
